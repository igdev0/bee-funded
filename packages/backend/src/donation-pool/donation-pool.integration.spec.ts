import { DonationPoolModule } from './donation-pool.module';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../database/database.module';
import { DataSource } from 'typeorm';
import { DonationPoolService } from './donation-pool.service';
import { UserService } from '../user/user.service';
import { ethers, parseUnits, Wallet } from 'ethers';
import { UserEntity } from '../user/entities/user.entity';
import { DonationPoolEntity } from './entities/donation-pool.entity';
import { ConfigService } from '@nestjs/config';
import { ChainConfig } from '../contracts.config';
import { NotificationService } from '../notification/notification.service';
import SpyInstance = jest.SpyInstance;

describe('Donation Pool integration tests', () => {
  let app: TestingModule;
  let userWallet: Wallet;
  let user: UserEntity;
  let donationPoolService: DonationPoolService;

  let notificationGetSettings: SpyInstance<
    ReturnType<NotificationService['getSettings']>
  >;

  let notificationSend: SpyInstance<ReturnType<NotificationService['send']>>;
  let notificationSave: SpyInstance<ReturnType<NotificationService['save']>>;
  let processActorNotifications: SpyInstance<
    ReturnType<NotificationService['processActorNotifications']>
  >;
  let processFollowersNotifications: SpyInstance<
    ReturnType<NotificationService['processFollowersNotifications']>
  >;
  let onDonationCreated: SpyInstance<
    ReturnType<DonationPoolService['onDonationCreated']>
  >;
  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [DatabaseModule, DonationPoolModule],
    }).compile();

    donationPoolService = app.get(DonationPoolService);
    onDonationCreated = jest.spyOn(donationPoolService, 'onDonationCreated');
    const notificationService = app.get(NotificationService);
    notificationGetSettings = jest.spyOn(notificationService, 'getSettings');
    notificationSend = jest.spyOn(notificationService, 'send');
    notificationSave = jest.spyOn(notificationService, 'save');
    processActorNotifications = jest.spyOn(
      notificationService,
      'processActorNotifications',
    );
    processFollowersNotifications = jest.spyOn(
      notificationService,
      'processFollowersNotifications',
    );
    await app.init();
    const userService = app.get(UserService);
    userWallet = new ethers.Wallet(
      '0x899938eb382711b1a52d714eed8be585b8eed7cadb33ce4ed593b530d2845d53',
    );

    user = await userService.create({
      wallet_address: await userWallet.getAddress(),
    });
  });

  let donationPool: DonationPoolEntity;

  it('should be able to create a donation pool', async () => {
    const entity = await donationPoolService.create(
      { kind: 'main' },
      user.profile.id,
    );
    donationPool = entity;
    expect(entity).toBeDefined();
  });

  it('should publish a donation pool and update the database', async () => {
    const contractsConfig = app
      .get(ConfigService)
      .get<ChainConfig[]>('contracts');
    if (!contractsConfig) {
      throw new Error('No contract config found.');
    }

    const provider = new ethers.JsonRpcProvider();
    const signer = await provider.getSigner(userWallet.address);
    const beeFundedCore = new ethers.Contract(
      contractsConfig[0].contracts.BeeFundedCore.address,
      contractsConfig[0].contracts.BeeFundedCore.abi,
      signer,
    );
    await beeFundedCore.createPool(
      '0xc63f7b99a289435e0f51f87fc7392961d42ce9c6',
      parseUnits('0', 6),
      donationPool.id_hash,
    );

    expect(onDonationCreated).toHaveBeenCalled();

    donationPool = await donationPoolService.getOwned(
      donationPool.id,
      user.profile.id,
    );
    expect(donationPool.status).toEqual('published');
  });

  it('should get notifications settings', () => {
    expect(notificationGetSettings).toHaveBeenCalled();
  });

  it('should process actor notifications', () => {
    expect(processActorNotifications).toHaveBeenCalled();
  });

  it('should process follower notifications', () => {
    expect(processFollowersNotifications).toHaveBeenCalled();
  });

  afterAll(async () => {
    const datasource = app.get(DataSource);
    await datasource.dropDatabase();
    await app.close();
  });
});
