import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import { DatabaseModule } from '../src/database/database.module';
interface ParsedCookie {
  name: string;
  value: string;
  attributes: Record<string, string | boolean>;
}

function parseRefreshTokenCookie(cookieHeader: string): ParsedCookie | null {
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const [nameValue, ...attributeParts] = parts;

  const [name, value] = nameValue.split('=');
  if (name !== 'refresh_token') return null;

  const attributes: Record<string, string | boolean> = {};
  for (const attr of attributeParts) {
    const [attrName, attrValue] = attr.split('=');
    attributes[attrName.toLowerCase()] = attrValue ?? true;
  }

  return {
    name,
    value,
    attributes,
  };
}

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;
  const wallet = ethers.Wallet.createRandom();
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          envFilePath: '.env.test.local',
          isGlobal: true,
        }),
        DatabaseModule,
        AuthModule,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    httpServer = app.getHttpServer();
  });

  let nonce: string;
  let accessToken: string;
  let refreshToken: ParsedCookie;
  it('GET /auth/nonce', () => {
    return request(httpServer)
      .get('/auth/nonce')
      .expect(200)
      .expect((res) => {
        const text = res.text;
        nonce = text;
        return text !== undefined;
      });
  });
  it('POST /auth/signin', async () => {
    const message = new SiweMessage({
      uri: 'http://localhost:3000',
      domain: 'localhost',
      chainId: 1337,
      version: '1',
      address: wallet.address,
      statement: 'Sign in with Ethereum to the app.',
      nonce,
    });

    const signature = await wallet.signMessage(message.prepareMessage());
    const authReq = request(httpServer)
      .post('/auth/signin')
      .send({ signature, message });
    return authReq.expect(200).expect((res) => {
      if (!res.header['set-cookie']) {
        throw new Error('Cookie was not set');
      }
      const refreshTokenCookie = parseRefreshTokenCookie(
        res.header['set-cookie'][0],
      );
      if (!refreshTokenCookie) {
        throw new Error('Refresh token was not set');
      }
      refreshToken = refreshTokenCookie;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      accessToken = res.body.accessToken as string;
    });
  });

  it('GET /auth/me', () => {
    return request(httpServer)
      .get('/auth/me')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (res.body.wallet_address !== wallet.address) {
          throw new Error('the wallet address does not match');
        }
      });
  });
  let newAccessToken: string;
  it('GET /auth/refresh', () => {
    return request(httpServer)
      .get('/auth/refresh')
      .set('authorization', `Bearer ${accessToken}`)
      .set('Cookie', [
        `${refreshToken.name}=${refreshToken.value}`,
        ...Object.keys(refreshToken.attributes).map(
          (item) => `${item}=${refreshToken.attributes[item]}`,
        ),
      ])
      .expect(200)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        newAccessToken = res.body.accessToken;
      });
  });

  it('should not be able to authenticate with blacklisted accessToken ', () => {
    return request(httpServer)
      .get('/auth/me')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('POST /auth/logout', () => {
    return request(httpServer)
      .post('/auth/signout')
      .set('authorization', `Bearer ${newAccessToken}`)
      .set('Cookie', [
        `${refreshToken.name}=${refreshToken.value}`,
        ...Object.keys(refreshToken.attributes).map(
          (item) => `${item}=${refreshToken.attributes[item]}`,
        ),
      ])
      .expect(200);
  });

  afterAll(async () => {
    const datasource = app.get(DataSource);
    await datasource.dropDatabase();
  });
});
