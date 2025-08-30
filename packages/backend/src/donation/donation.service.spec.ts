import { Test, TestingModule } from '@nestjs/testing';
import { DonationService } from './donation.service';
import { DonationModule } from './donation.module';
import { DatabaseModule } from '../database/database.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import {
  Contract,
  ethers,
  JsonRpcProvider,
  parseUnits,
  Signer,
  Wallet,
} from 'ethers';
import { UserService } from '../user/user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DonationPoolService } from '../donation-pool/donation-pool.service';
import { ChainConfig } from '../chain/chain.config';
import {
  DonationManager,
  ERC20Permit,
  ERC20Permit__factory,
} from '@bee-funded/contracts';
import { DonationPoolEntity } from '../donation-pool/entities/donation-pool.entity';
import { MailService } from '../mail/mail.service';
import SpyInstance = jest.SpyInstance;

// --- Helper function for generating Permit signature ---
async function generatePermitSignature(
  ownerSigner: Signer, // The ethers.Signer of the token owner
  spenderAddress: string, // The address of BeeFunded contract
  tokenContract: ERC20Permit, // The MockERC20 contract instance
  value: bigint, // The amount to permit (e.g., total subscription value)
  deadline: bigint, // The deadline for the permit signature
  chainId: number,
) {
  const ownerAddress = await ownerSigner.getAddress();
  const nonce = await tokenContract.nonces(ownerAddress); // Get current nonce for the owner
  const domain = {
    name: await tokenContract.name(), // Name of the ERC20Permit token (e.g., "MockToken")
    version: '1', // EIP-2612 standard version
    chainId: chainId,
    verifyingContract: await tokenContract.getAddress(), // Address of the ERC20Permit token contract
  };

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  };

  // Use ownerSigner to sign the typed data
  const signature = await ownerSigner.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature); // Use ethers.Signature.from for splitting

  return {
    v: BigInt(sig.v),
    r: sig.r,
    s: sig.s,
    deadline,
  };
}

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
    const { data, hasPreviousPage, page, hasNextPage, limit, total } =
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
