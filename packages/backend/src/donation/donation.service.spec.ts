import { Test, TestingModule } from '@nestjs/testing';
import { DonationService } from './donation.service';
import { DonationModule } from './donation.module';
import { DatabaseModule } from '../database/database.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Contract, ethers, JsonRpcProvider, parseUnits, Wallet } from 'ethers';
import { UserService } from '../user/user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DonationPoolService } from '../donation-pool/donation-pool.service';
import { ChainConfig } from '../chain/chain.config';
import { DonationManager, ERC20Permit__factory } from '@bee-funded/contracts';
import { DonationPoolEntity } from '../donation-pool/entities/donation-pool.entity';
import { MailService } from '../mail/mail.service';
import { generatePermitSignature } from '../../test/helpers';
import SpyInstance = jest.SpyInstance;

describe('DonationService', () => {
  let module: TestingModule;
  let service: DonationService;
  let wallet: Wallet;
  let user: UserEntity;
  let mockUSDCTokenAddress: string;
  let chain: ChainConfig;
  let save: SpyInstance<ReturnType<DonationService['save']>>;
  let pool: DonationPoolEntity;
  let processDonationReceivedNotification: SpyInstance<
    ReturnType<DonationService['processDonationReceivedNotification']>
  >;
  let processDonationReceiptNotifications: SpyInstance<
    ReturnType<DonationService['processDonationReceiptNotifications']>
  >;

  let onDonationSuccess: SpyInstance<
    ReturnType<DonationService['onDonationSuccess']>
  >;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DonationModule,
        DatabaseModule,
        await ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test.local',
        }),
      ],
    })
      .overrideProvider(MailService)
      .useValue({
        sendMail: jest.fn().mockResolvedValue({}),
        sendNotification: jest.fn().mockResolvedValue({}),
        sendVerificationEmail: jest.fn().mockResolvedValue({}),
      })
      .compile();

    service = module.get(DonationService);
    onDonationSuccess = jest.spyOn(service, 'onDonationSuccess');

    await module.init();

    processDonationReceiptNotifications = jest.spyOn(
      service,
      'processDonationReceiptNotifications',
    );
    processDonationReceivedNotification = jest.spyOn(
      service,
      'processDonationReceivedNotification',
    );

    save = jest.spyOn(service, 'save');

    const chains = module.get(ConfigService).get<ChainConfig[]>('chains');

    if (!chains) {
      throw new Error('Chains not found');
    }
    chain = chains[0];

    wallet = new Wallet(
      module.get(ConfigService).get<string>('DEPLOYER_PRIVATE_KEY') as string,
      new JsonRpcProvider(chain.rpcUrl),
    );
    mockUSDCTokenAddress = module
      .get(ConfigService)
      .get<string>('MOCK_USDC_TOKEN') as string;
    // 1. Create a user
    const userService = module.get(UserService);
    user = await userService.create({
      wallet_address: wallet.address,
    });

    // 2. Create donation pool

    const poolService = module.get(DonationPoolService);
    pool = await poolService.create(
      {
        kind: 'main',
      },
      user.profile.id,
    );

    const { address: beeFunedCoreAddress, abi: beeFunedCoreAbi } =
      chain.contracts.BeeFundedCore;

    const runner = new ethers.JsonRpcProvider(chain.rpcUrl);
    const signer = await runner.getSigner(wallet.address);
    const beeFundedCoreContract = new ethers.Contract(
      beeFunedCoreAddress,
      beeFunedCoreAbi,
      signer,
    );

    await beeFundedCoreContract.createPool(
      mockUSDCTokenAddress,
      parseUnits('0', 6),
      pool.id_hash,
    );

    pool = await poolService.getOwned(pool.id, user.profile.id);
    expect(pool.status).toEqual('published');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be able to donate and update database', async () => {
    const provider = new JsonRpcProvider(chain.rpcUrl);
    const mockedUSDC = ERC20Permit__factory.connect(
      mockUSDCTokenAddress,
      // @ts-expect-error should work
      provider,
    );
    const donationManager = new Contract(
      chain.contracts.DonationManager.address,
      chain.contracts.DonationManager.abi,
      wallet,
    ) as unknown as DonationManager;
    const signer = await provider.getSigner(wallet.address);
    const value = ethers.parseUnits('100', 6);
    const { v, r, s, deadline } = await generatePermitSignature(
      signer,
      chain.contracts.DonationManager.address,
      mockedUSDC,
      value,
      BigInt(Date.now() + 1000 * 60 * 60 * 60),
      chain.chainId,
    );
    await donationManager.donateWithPermit(
      wallet.address,
      BigInt(pool.on_chain_id as string),
      await mockedUSDC.getAddress(),
      value,
      'Thank you',
      deadline,
      v,
      r,
      s,
    );
    expect(save).toHaveBeenCalled();
    expect(onDonationSuccess).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 100)); // wait until onDonationSuccess completes
    expect(processDonationReceiptNotifications).toHaveBeenCalled();
    expect(processDonationReceivedNotification).toHaveBeenCalled();
  });

  it('should be able to retrieve user owned donations', async () => {
    const { data, hasPreviousPage, page, hasNextPage } =
      await service.getManyOwned(user.profile.id, 1, 10);

    expect(data.length).toBe(1);
    expect(hasPreviousPage).toBe(false);
    expect(page).toBe(1);
    expect(hasNextPage).toBe(false);
  });

  afterAll(async () => {
    const source = module.get<DataSource>(DataSource);
    await source.dropDatabase();
    await source.destroy();
    await module.close();
  });
});
