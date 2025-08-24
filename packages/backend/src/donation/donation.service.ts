import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DonationEntity from './entity/donation.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChainConfig } from '../chain/chain.config';
import { Contract, Log, WebSocketProvider } from 'ethers';
import { SaveDonationDto } from './dto/save-donation.dto';
import { UserService } from '../user/user.service';
import { DonationPoolService } from '../donation-pool/donation-pool.service';
import { NotificationService } from '../notification/notification.service';
import ProfileEntity from '../profile/entities/profile.entity';
import { MailService } from '../mail/mail.service';
import { ChainService } from '../chain/chain.service';

@Injectable()
export class DonationService implements OnModuleInit, OnModuleDestroy {
  private chains: ChainConfig[];
  private providers: WebSocketProvider[];

  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepository: Repository<DonationEntity>,
    private readonly donationPoolService: DonationPoolService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly chainConfig: ConfigService,
    private readonly chainService: ChainService,
  ) {
    const chains = this.chainConfig.get<ChainConfig[]>('chains');
    if (!chains) {
      throw new Error('Chain configuration not set');
    }
  }

  async save(payload: SaveDonationDto): Promise<ProfileEntity | null> {
    const donatorProfile = await this.userService.findOneByWalletAddress(
      payload.donor_address,
    );
    const profile = donatorProfile?.profile;

    const donationPool = await this.donationPoolService.getOneByOnChainPoolId(
      BigInt(payload.on_chain_pool_id),
    );

    const entity = this.donationRepository.create({
      amount: BigInt(payload.amount),
      donor_address: payload.donor_address,
      donor_profile: profile,
      token: payload.token,
      message: payload.message,
      is_recurring: payload.is_recurring,
      pool: donationPool,
      tx_hash: payload.tx_hash,
    });
    await this.donationRepository.save(entity);
    return donatorProfile?.profile || null;
  }

  async onModuleInit(): Promise<void> {
    for (const chain of this.chains) {
      const provider = new WebSocketProvider(chain.wsUrl);
      const contract = new Contract(
        chain.contracts.DonationManager.address,
        chain.contracts.DonationManager.abi,
        provider,
      );

      await contract.on('DonationSuccess', this.onDonationSuccess.bind(this));
    }
  }

  /**
   * Lifecycle hook called when the module is being destroyed.
   *
   * Cleans up all WebSocket providers initialized during `onModuleInit`.
   *
   * @remarks
   * - Fetches chain configurations from the application config (`contracts` key) to ensure chains are set.
   * - Throws an error if no chain configurations are found.
   * - Calls `destroy()` on each WebSocketProvider in `this.providers` to properly close connections.
   * - Use `Promise.all` to wait for all providers to be destroyed concurrently.
   */
  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      this.providers.map((provider) => {
        return provider.destroy();
      }),
    );
  }

  private async onDonationSuccess(
    pool_id: bigint,
    donor_address: string,
    token: string,
    amount: bigint,
    message: string,
    event: Log,
  ) {
    const actorProfile = await this.save({
      amount: amount.toString(),
      donor_address,
      on_chain_pool_id: pool_id.toString(),
      token,
      is_recurring: false,
      message,
      tx_hash: event.transactionHash,
    });
    const { chain_id, profile: poolOwnerProfile } =
      await this.donationPoolService.getOneByOnChainPoolId(
        pool_id,
        {
          id: true,
          profile: {
            id: true,
            display_name: true,
          },
        },
        ['profile'],
      );

    const chain = this.chainService.getChainById(chain_id as number); // We can ignore the null case, as the pool should have been created already

    if (actorProfile) {
      const { settings } = await this.notificationService.getSettings(
        actorProfile.id,
      );

      if (
        settings.channels.inApp.enabled &&
        settings.channels.inApp.notifications.donationReceipt
      ) {
        const notificationEntity = await this.notificationService.save(
          actorProfile.id,
          {
            type: 'donation_receipt',
            title: 'Donation completed successfully',
            message: 'Thank you for donating!',
            actor: actorProfile,
          },
        );
        this.notificationService.send(actorProfile.id, notificationEntity);
      }

      if (
        settings.channels.email.enabled &&
        settings.channels.email.notifications.donationReceipt
      ) {
        await this.mailService.sendMail({
          template: 'donation-receipt',
          context: {
            donorName: actorProfile.display_name || actorProfile.username,
            date: new Date().getDate().toLocaleString(),
            amount: amount.toString(),
            token,
            explorerUrl: `${chain.explorerUrl}?txHash=${event.transactionHash}`,
            txHash: event.transactionHash,
            recipient: poolOwnerProfile
              ? poolOwnerProfile.display_name || poolOwnerProfile.username
              : 'No recipient name',
          },
          subject: 'Donation receipt',
          to: actorProfile.email as string,
        });
      }
    }
  }
}
