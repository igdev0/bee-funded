import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { ethers } from 'ethers';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as cookieParser from 'cookie-parser';
import { ProfileModule } from '../src/profile/profile.module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { SiweMessage } from 'siwe';
import * as process from 'node:process';
import { MailModule } from '../src/mail/mail.module';
import { DatabaseModule } from '../src/database/database.module';

const uploadsDir = process.cwd() + '/uploads';

function deleteAllUploads() {
  try {
    const userDirs = fs.readdirSync(uploadsDir);

    for (const userId of userDirs) {
      const userPath = path.join(uploadsDir, userId);
      const stat = fs.lstatSync(userPath);

      if (stat.isDirectory()) {
        const file = fs.readdirSync(userPath);

        file.forEach((filePath) => {
          fs.unlinkSync(path.join(userPath, filePath));
        });
        fs.rmdirSync(userPath);
      }
    }
  } catch (err) {
    console.error('Error deleting uploads:', err);
  }
}

jest.mock('@nestjs-modules/mailer/dist/adapters/handlebars.adapter', () => {
  return {
    HandlebarsAdapter: jest.fn().mockImplementation(() => ({
      compile: jest.fn(),
    })),
  };
});

describe('ProfileController (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;

  const users = Array(2)
    .fill(0)
    .map(() => ({
      wallet: ethers.Wallet.createRandom(),
      accessToken: undefined,
      profileId: undefined,
    }));

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          envFilePath: '.env.test.local',
          isGlobal: true,
        }),
        DatabaseModule,
        AuthModule,
        ProfileModule,
        MailModule,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    httpServer = app.getHttpServer();

    // Let's authenticate now
    await Promise.all(
      users.map(async ({ wallet }, index) => {
        const res = await request(httpServer).get('/auth/nonce').expect(200);
        const message = new SiweMessage({
          uri: 'http://localhost:3000',
          domain: 'localhost',
          chainId: 1337,
          version: '1',
          address: wallet.address,
          statement: 'Sign in with Ethereum to the app.',
          nonce: res.text,
        });
        const signature = await wallet.signMessage(message.prepareMessage());
        const authRes = await request(httpServer)
          .post('/auth/signin')
          .send({ signature, message })
          .expect(200);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        users[index].accessToken = authRes.body.accessToken;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        users[index].profileId = authRes.body.user.profile.id;
      }),
    );
  });

  it('should be able to update bio', async () => {
    const res = await request(httpServer)
      .patch('/profile')
      .send({ bio: 'My personal bio' })
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.bio).toEqual('My personal bio');
  });

  it('should be able to update username', async () => {
    await Promise.all(
      users.map(async ({ accessToken }, index) => {
        const res = await request(httpServer)
          .patch('/profile')
          .send({ username: `igdev-${index}` })
          .set('authorization', `Bearer ${accessToken}`)
          .expect(200);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.username).toEqual(`igdev-${index}`);
      }),
    );
  });

  it('should be able to update username', async () => {
    const res = await request(httpServer)
      .patch('/profile')
      .send({ email: 'igdev@gmail.com' })
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.email).toEqual('igdev@gmail.com');
  });

  it('should be able to update displayName', async () => {
    const res = await request(httpServer)
      .patch('/profile')
      .send({ display_name: 'Ianos' })
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.display_name).toEqual('Ianos');
  });

  it('should be able to update socialLinks', async () => {
    const res = await request(httpServer)
      .patch('/profile')
      .send({
        social_links: ['https://www.facebook.com', 'https://www.instagram.com'],
      })
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.social_links).toEqual([
      'https://www.facebook.com',
      'https://www.instagram.com',
    ]);
  });

  it('should be able to update avatar', async () => {
    const res = await request(httpServer)
      .post('/profile/update-avatar')
      .attach('avatar', `${process.cwd()}/assets/default-avatar.png`)
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.avatar).toContain('default-avatar.png');
  });

  it('should be able to update cover', async () => {
    const res = await request(httpServer)
      .patch('/profile/update-cover')
      .attach('cover', `${process.cwd()}/assets/default-cover.png`)
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.cover).toContain('default-cover.png');
  });

  it('should be able to follow users', async () => {
    await request(httpServer)
      .patch(`/profile/${users[1].profileId}/follow`)
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);
  });

  it('should be able to unfollow users', async () => {
    await request(httpServer)
      .patch(`/profile/${users[1].profileId}/unfollow`)
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(200);
  });

  it('should not be able to follow yourself', async () => {
    await request(httpServer)
      .patch(`/profile/${users[0].profileId}/follow`)
      .set('authorization', `Bearer ${users[0].accessToken}`)
      .expect(422);
  });

  describe('sending and verifying email', () => {
    let verificationCode: string;
    it('should be able to send email verification code', async () => {
      const res = await request(httpServer)
        .post(`/profile/send-email-verification`)
        .set('authorization', `Bearer ${users[0].accessToken}`)
        .expect(201);
      verificationCode = res.text;
    });

    it('should be able to verify email verification code', async () => {
      await request(httpServer)
        .patch(`/profile/verify-email`)
        .set('authorization', `Bearer ${users[0].accessToken}`)
        .send({ verificationCode: verificationCode })
        .expect(200);
    });
  });

  it('should find be able to find if username is taken ', async () => {
    const res = await request(httpServer)
      .get('/profile/igdev-0/taken')
      .expect(200);
    expect(JSON.parse(res.text)).toEqual(true);
  });

  afterAll(async () => {
    const datasource = app.get(DataSource);
    await datasource.dropDatabase();
    deleteAllUploads();
  });
});
