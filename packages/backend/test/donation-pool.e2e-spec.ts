import { Test, TestingModule } from '@nestjs/testing';
import { DonationPoolModule } from '../src/donation-pool/donation-pool.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../src/database/database.module';
import * as cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DonationPoolStatus } from '../src/donation-pool/types';

describe('Donation Pool', () => {
  let app: INestApplication<App>;
  let httpServer: App;

  const user: {
    wallet: ReturnType<typeof ethers.Wallet.createRandom>;
    accessToken?: string;
    profileId?: string;
  } = {
    wallet: ethers.Wallet.createRandom(),
    accessToken: undefined,
    profileId: undefined,
  };
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          envFilePath: '.env.test.local',
          isGlobal: true,
        }),
        DonationPoolModule,
        DatabaseModule,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());

    await app.init();
    httpServer = app.getHttpServer();

    const res = await request(httpServer).get('/auth/nonce');

    const message = new SiweMessage({
      uri: 'http://localhost:3000',
      domain: 'localhost',
      chainId: 1337,
      version: '1',
      address: user.wallet.address,
      statement: 'Sign in with Ethereum to the app.',
      nonce: res.text,
    });
    const signature = await user.wallet.signMessage(message.prepareMessage());
    const authRes = await request(httpServer)
      .post('/auth/signin')
      .send({ signature, message });
    if (authRes.body) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      user.accessToken = authRes.body.accessToken as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      user.profileId = authRes.body.user.profile.id as string;
    }
  });

  describe('POST /donation-pool', () => {
    it('should create a donation pool with', async () => {
      const res = await request(httpServer)
        .post('/donation-pool')
        .set('authorization', `Bearer ${user.accessToken}`)
        .send({ kind: 'main' });
      expect(res.statusCode).toBe(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.status as DonationPoolStatus).toBe('publishing');
    });
  });

  afterAll(async () => {
    const datasource = app.get(DataSource);
    await datasource.dropDatabase();
    await datasource.destroy();
    await app.close();
  });
});
