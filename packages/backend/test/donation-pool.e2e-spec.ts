import { Test, TestingModule } from '@nestjs/testing';
import { DonationPoolModule } from '../src/donation-pool/donation-pool.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../src/database/database.module';
import * as cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { Contract, ethers, JsonRpcProvider, parseUnits, Wallet } from 'ethers';
import { SiweMessage } from 'siwe';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DonationPoolStatus } from '../src/donation-pool/types';
import { ChainConfig } from '../src/chain/chain.config';
import { DonationPoolEntity } from '../src/donation-pool/entities/donation-pool.entity';
import * as process from 'node:process';

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
  let mainDonationPool = {
    id: '',
    id_hash: '',
  };
  let objectiveDonationPool = {
    id: '',
    id_hash: '',
  };
  describe('POST /donation-pool', () => {
    it('should create a donation pool with', async () => {
      const res = await request(httpServer)
        .post('/donation-pool')
        .set('authorization', `Bearer ${user.accessToken}`)
        .send({ kind: 'main' });
      expect(res.statusCode).toBe(201);

      mainDonationPool = {
        id: (res.body as DonationPoolEntity).id,
        id_hash: (res.body as DonationPoolEntity).id_hash,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.status as DonationPoolStatus).toBe('publishing');
    });

    it('should be able to create a objective kind of donation pool', async () => {
      const res = await request(httpServer)
        .post(`/donation-pool`)
        .set('authorization', `Bearer ${user.accessToken}`)
        .send({
          kind: 'objective',
          title: 'Some title',
          description: 'Some description',
          tags: ['test'],
        });
      objectiveDonationPool = {
        id: (res.body as DonationPoolEntity).id,
        id_hash: (res.body as DonationPoolEntity).id_hash,
      };
      expect(res.statusCode).toBe(201);
    });
  });

  describe('PATCH /donation-pool/:id', () => {
    it('should be able to update a donation pool', async () => {
      const res = await request(httpServer)
        .patch(`/donation-pool/${objectiveDonationPool.id}`)
        .set('authorization', `Bearer ${user.accessToken}`)
        .send({
          title: 'Updated title',
          description: 'Updated description',
          tags: ['Updated'],
        });

      expect(res.statusCode).toBe(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.title as string).toEqual('Updated title');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.description as string).toEqual('Updated description');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.tags as string).toEqual(['Updated']);
    });
  });

  describe('On contract DonationPoolCreated event', () => {
    it('should modify the status of the donation pool once published onchain', async () => {
      const config = app.get(ConfigService);

      const chains = config.get<ChainConfig[]>('contracts');
      if (!chains) {
        throw new Error('Contracts config must be set');
      }

      for (const chain of chains) {
        const provider = new JsonRpcProvider(chain.rpcUrl);
        const { abi: beeFundedCoreAbi, address: beeFundedCoreAddress } =
          chain.contracts.BeeFundedCore;
        const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY as string);
        const signer = await provider.getSigner(wallet.address);
        const contract = new Contract(
          beeFundedCoreAddress,
          beeFundedCoreAbi,
          signer,
        );

        await contract.createPool(
          '0xc63f7b99a289435e0f51f87fc7392961d42ce9c6',
          parseUnits('0', 6),
          mainDonationPool.id_hash,
        );

        const res = await request(httpServer)
          .get(`/donation-pool/${mainDonationPool.id}`)
          .set('authorization', `Bearer ${user.accessToken}`);

        expect(res.statusCode).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.status as DonationPoolStatus).toBe('published');
      }
    });
  });

  it('should be able to update donation pool image', async () => {
    await request(httpServer)
      .patch(`/donation-pool/${objectiveDonationPool.id}/update-image`)
      .attach('image', `${process.cwd()}/assets/default-avatar.png`);
  });

  afterAll(async () => {
    const datasource = app.get(DataSource);
    await datasource.dropDatabase();
    await datasource.destroy();
    await app.close();
  });
});
