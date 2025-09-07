import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import SubscriptionEntity from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { ChainService } from '../chain/chain.service';
import { ChainConfig } from '../chain/chain.config';
import { Contract, JsonRpcProvider, WebSocketProvider } from 'ethers';
import SaveSubscriptionDto from './dto/save-subscription.dto';
import { DonationPoolService } from '../donation-pool/donation-pool.service';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import ProfileEntity from '../profile/entities/profile.entity';
import { MailService } from '../mail/mail.service';
import { erc20Abi } from 'viem';
import { ConfigService } from '@nestjs/config';
import { TokenizerService } from '../tokenizer/tokenizer.service';
import {
  NotificationTypes,
  SaveNotificationI,
} from '../notification/notification.interface';
import NotificationEntity from '../notification/entities/notification.entity';
import { UserEntity } from '../user/entities/user.entity';
import { SendMailPayload } from '../mail/mail.interface';

/**
 * @todo – Send notification and email based on profile settings for beneficiary and subscriber, when creating a subscription.
 * @todo – Send notification and email based on profile settings for beneficiary and subscriber, when subscriber is unsubscribed.
 * @todo – Update donation email (donation-received.hbs & donation-receipt.hbs) to include details if the donation is recurring or not.
 * @todo – Send notification and email based on profile settings for subscriber and beneficiary
 */
@Injectable()
export class SubscriptionService implements OnModuleDestroy, OnModuleInit {
  chains: ChainConfig[];
  providers: WebSocketProvider[] = [];

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly poolService: DonationPoolService,
    private readonly chainService: ChainService,
    private readonly configService: ConfigService,
    private readonly tokenizer: TokenizerService,
    private readonly mailService: MailService,
  ) {
    this.chains = this.chainService.chains;
  }

  async save(payload: SaveSubscriptionDto) {
    const poolId = await this.poolService.getPoolIdByChainId(payload.pool_id);
    const entity = this.subscriptionRepository.create({
      remaining_payments: payload.remaining_payments,
      total_payments: payload.remaining_payments,
      subscriber: payload.subscriber,
      amount: payload.amount,
      pool_id: payload.pool_id,
      on_chain_subscription_id: payload.subscription_id,
      interval: payload.interval,
      active: true,
      token: payload.token,
      deadline: payload.deadline,
      pool: { id: poolId ?? undefined },
    });
    await this.subscriptionRepository.save(entity);
  }

  /**
   * This function processes the SubscriptionCreated on-chain event.
   * @param subscriptionId – The subscription id created on-chain.
   * @param poolId – The pool id created on-chain.
   * @param subscriber – The subscriber wallet address.
   * @param beneficiary – The beneficiary wallet address.
   * @param token – The permit token address
   * @param amount – The amount donated
   * @param interval – The interval of the subscription.
   * @param totalPayments – Total payments of the subscription.
   * @param deadline – The deadline of the signature
   */
  async onSubscriptionCreated(
    subscriptionId: bigint,
    poolId: bigint,
    subscriber: string,
    beneficiary: string,
    token: string,
    amount: bigint,
    interval: bigint,
    totalPayments: bigint,
    deadline: bigint,
  ) {
    await this.save({
      deadline: Number(deadline),
      beneficiary,
      token,
      amount: amount.toString(),
      subscription_id: Number(subscriptionId),
      remaining_payments: Number(totalPayments) - 1,
      total_payments: Number(totalPayments),
      interval: Number(interval),
      subscriber,
      pool_id: Number(poolId),
    });

    const intervalHuman = `${Number(interval) / 120 / 24} days`;
    const poolEntity = await this.poolService.getOneByOnChainPoolId(
      poolId.toString(),
    );
    const subscriberEntity =
      await this.userService.findOneByWalletAddress(subscriber);

    const beneficiaryEntity =
      await this.userService.findOneByWalletAddress(beneficiary);

    // poolEntity.chain_id cannot be null unless the BeeFundedContract doesn't emit the PoolCreated event.
    const provider = new JsonRpcProvider(
      this.chainService.getChainById(poolEntity.chain_id as number).rpcUrl,
    );
    const tokenContract = new Contract(token, erc20Abi, provider);

    const tokenDecimals: number = (await tokenContract.decimals()) as number;
    const tokenSymbol: string = (await tokenContract.symbol()) as string;

    // 1. Process subscriber email and in-app notification
    if (subscriberEntity) {
      const mailPayload: SendMailPayload = {
        template: 'subscription-receipt',
        context: {
          subscriberName: subscriberEntity.profile?.display_name ?? 'User',

          poolName: poolEntity.title ?? 'Untitled',
          subscriptionId: subscriptionId.toString(),
          poolId: poolId.toString(),

          beneficiaryAddress: beneficiary,
          beneficiaryName:
            beneficiaryEntity?.profile.display_name ?? 'No beneficiary name',

          amount: amount.toString(),
          tokenDecimals,
          tokenSymbol,
          token: token,

          intervalHuman,
          remainingPayments: Number(totalPayments) - 1,

          deadline: Number(deadline),
        },
        subject: 'Subscription created receipt',
        to: subscriberEntity.profile.email as string,
      };

      const saveNotificationPayload: SaveNotificationI = {
        type: 'subscription_creation_receipt',
        title: 'You have successfully subscribed to "{poolName}"',
        message: 'Thank you for subscribing',
        actor: subscriberEntity.profile,
      };
      const sendNotificationOverride = {
        title: this.tokenizer.format(saveNotificationPayload.title, {
          poolName: poolEntity.title as string,
        }),
      };
      await this.processChannelsNotification(
        subscriberEntity.profile,
        mailPayload,
        saveNotificationPayload,
        sendNotificationOverride,
        'subscriptionCreationReceipt',
      );
    }

    // 2. Process beneficiary email and notification

    if (beneficiaryEntity) {
      const mailPayload: SendMailPayload = {
        template: 'new-subscriber',
        context: {
          poolName: poolEntity.title ?? 'Untitled',
          poolOwnerName:
            beneficiaryEntity.profile.display_name ??
            beneficiaryEntity.profile.username,
          subscriptionId: subscriptionId.toString(),
          poolId: poolId.toString(),

          subscriberAddress: subscriber,
          subscriberName: subscriberEntity?.profile.display_name ?? 'Anonymous',

          beneficiaryAddress: beneficiary,
          beneficiaryName:
            beneficiaryEntity.profile.display_name ??
            beneficiaryEntity.profile.username,

          amount: amount.toString(),
          tokenDecimals,
          token,

          intervalHuman,
          remainingPayments: Number(totalPayments) - 1,

          deadline: Number(deadline), // formatted via `formatDate`
        },
        subject: 'Subscription created receipt',
        to: beneficiaryEntity.profile.email as string,
      };
      const saveNotificationPayload: SaveNotificationI = {
        type: 'subscription_creation_receipt',
        title: 'Congrats!🥂 your {poolName} received a new subscription!',
        message: 'I hope this message finds you well!',
        actor: subscriberEntity?.profile,
      };

      const sendNotificationOverride = {
        title: this.tokenizer.format(saveNotificationPayload.title, {
          poolName: poolEntity.title ?? 'No pool title',
        }),
      };
      await this.processChannelsNotification(
        beneficiaryEntity.profile,
        mailPayload,
        saveNotificationPayload,
        sendNotificationOverride,
        'newSubscriber',
      );
    }
  }

  async onUnsubscribe(subscriptionId: bigint) {
    await this.subscriptionRepository.update(
      {
        on_chain_subscription_id: Number(subscriptionId),
      },
      {
        active: false,
        next_payment_time: 0,
        remaining_payments: 0,
      },
    );
    const subscriptionEntity = await this.subscriptionRepository.findOneOrFail({
      where: { on_chain_subscription_id: Number(subscriptionId) },
      relations: ['pool', 'pool.profile'],
    });

    const { profile: unsubscriberProfile } =
      (await this.userService.findOneByWalletAddress(
        subscriptionEntity.subscriber,
      )) as UserEntity;

    // 1. Process unsubscriber receipt notifications
    if (unsubscriberProfile) {
      const sendMailPayload: SendMailPayload = {
        template: 'unsubscribed-receipt',
        subject: 'Unsubscribed successfully',
        context: {
          subscriberName:
            unsubscriberProfile.display_name ?? unsubscriberProfile.username,
          poolName: subscriptionEntity.pool.title ?? 'Untitled',
          subscriptionId: subscriptionId.toString(),
          poolId: subscriptionEntity.pool_id.toString(),
          beneficiaryAddress: subscriptionEntity.pool.owner_address as string,
          beneficiaryName:
            subscriptionEntity.pool.profile?.display_name ??
            subscriptionEntity.pool.profile?.username,
          completedPayments: subscriptionEntity.remaining_payments,
          totalPayments: subscriptionEntity.total_payments,
        },
        to: unsubscriberProfile.email as string,
      };
      const saveNotificationPayload: SaveNotificationI = {
        title: 'Unsubscribed successfully',
        actor: unsubscriberProfile,
        message: 'You have unsubscribed from pool {poolName}',
        type: 'subscription_canceled_receipt',
      };

      const sendNotificationOverride: Partial<NotificationEntity> = {
        message: this.tokenizer.format(saveNotificationPayload.message, {
          poolName: subscriptionEntity.pool.title ?? 'Untitled',
        }),
      };
      await this.processChannelsNotification(
        subscriptionEntity.pool.profile as ProfileEntity,
        sendMailPayload,
        saveNotificationPayload,
        sendNotificationOverride,
        'subscriptionCanceledReceipt',
      );
    }
    // 2. Process pool owner notifications

    const ownerProfile = subscriptionEntity.pool.profile;
    if (ownerProfile) {
      const sendMailPayload: SendMailPayload = {
        template: 'unsubscribed-pool-owner-notice',
        subject: 'Unsubscribed successfully',
        context: {
          poolName: subscriptionEntity.pool.title ?? 'Untitled',
          poolOwnerName: ownerProfile.display_name ?? ownerProfile.username,

          subscriptionId: subscriptionId.toString(),
          poolId: subscriptionEntity.pool_id.toString(),

          subscriberAddress: subscriptionEntity.subscriber,
          subscriberName:
            unsubscriberProfile.display_name ??
            unsubscriberProfile.username ??
            'No name',

          beneficiaryAddress:
            subscriptionEntity.pool.owner_address ?? 'no address',
          beneficiaryName:
            ownerProfile.display_name ?? ownerProfile.username ?? 'No name',

          completedPayments:
            subscriptionEntity.total_payments -
            subscriptionEntity.remaining_payments,
          totalPayments: subscriptionEntity.total_payments,
        },
        to: unsubscriberProfile.email as string,
      };
      const saveNotificationPayload: SaveNotificationI = {
        title: 'User {displayName} unsubscribed from one of your pools',
        actor: unsubscriberProfile,
        message: 'User {displayName} unsubscribed from pool {poolName}',
        type: 'subscription_canceled',
      };

      const sendNotificationOverride: Partial<NotificationEntity> = {
        title: this.tokenizer.format(saveNotificationPayload.title, {
          displayName:
            unsubscriberProfile.display_name ?? unsubscriberProfile.username,
        }),
        message: this.tokenizer.format(saveNotificationPayload.message, {
          poolName: subscriptionEntity.pool.title ?? 'Untitled',
          displayName:
            unsubscriberProfile.display_name ?? unsubscriberProfile.username,
        }),
      };
      await this.processChannelsNotification(
        subscriptionEntity.pool.profile as ProfileEntity,
        sendMailPayload,
        saveNotificationPayload,
        sendNotificationOverride,
        'subscriptionCanceled',
      );
    }
  }

  async onSubscriptionPaymentSuccess(
    id: bigint,
    subscriber: string,
    remainingPayments: bigint,
    nextPaymentTime: bigint,
  ) {
    await this.subscriptionRepository.update(
      {
        on_chain_subscription_id: Number(id),
        subscriber,
      },
      {
        remaining_payments: Number(remainingPayments),
        next_payment_time: Number(nextPaymentTime),
      },
    );
  }

  async onSubscriptionExpired(subscriptionId: bigint, subscriber: string) {
    await this.subscriptionRepository.update(
      {
        on_chain_subscription_id: Number(subscriptionId),
        subscriber,
      },
      {
        active: false,
        expired: true,
        next_payment_time: 0,
        remaining_payments: 0,
      },
    );
  }

  async onSubscriptionPaymentFailed(
    subscriptionId: bigint,
    subscriber: string,
    remainingPayments: bigint,
    nextPaymentTime: bigint,
  ) {
    await this.subscriptionRepository.update(
      {
        on_chain_subscription_id: Number(subscriptionId),
        subscriber,
      },
      {
        remaining_payments: Number(remainingPayments),
        next_payment_time: Number(nextPaymentTime),
      },
    );
  }

  async onModuleInit(): Promise<void> {
    for (const chain of this.chains) {
      const provider = new WebSocketProvider(chain.wsUrl);
      const contract = new Contract(
        chain.contracts.SubscriptionManager.address,
        chain.contracts.SubscriptionManager.abi,
        provider,
      );

      const automationContract = new Contract(
        chain.contracts.AutomationUpkeep.address,
        chain.contracts.AutomationUpkeep.abi,
        provider,
      );

      await contract.on(
        'SubscriptionCreated',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.onSubscriptionCreated.bind(this),
      );

      await contract.on(
        'Unsubscribed',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.onUnsubscribe.bind(this),
      );

      await automationContract.on(
        'SubscriptionPaymentSuccess',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.onSubscriptionPaymentSuccess.bind(this),
      );

      await automationContract.on(
        'SubscriptionPaymentFailed',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.onSubscriptionPaymentFailed.bind(this),
      );

      await automationContract.on(
        'SubscriptionExpired',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.onSubscriptionExpired.bind(this),
      );

      this.providers.push(provider);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      this.providers.map((provider) => {
        return provider.destroy();
      }),
    );
  }

  private async processChannelsNotification(
    profile: ProfileEntity,
    sendMailPayload: SendMailPayload,
    saveNotificationPayload: SaveNotificationI,
    sendNotificationOverride: Partial<NotificationEntity>,
    kind: keyof NotificationTypes,
  ) {
    const { settings: notificationSettings } =
      await this.notificationService.getSettings(profile.id);
    if (
      notificationSettings.channels.email.enabled &&
      notificationSettings.channels.email.notifications[kind] &&
      profile.email
    ) {
      await this.mailService.sendMail(sendMailPayload);
    }

    if (
      notificationSettings.channels.inApp.enabled &&
      notificationSettings.channels.inApp.notifications[kind]
    ) {
      const notificationEntity = await this.notificationService.save(
        profile.id,
        saveNotificationPayload,
      );

      this.notificationService.send(profile.id, {
        ...notificationEntity,
        ...sendNotificationOverride,
      });
    }
  }

  private processSubscriptionCreatedSubscriberNotificationChannels(
    profile: ProfileEntity,
  ) {}

  private processSubscriptionCreatedBeneficiaryNotificationChannels(
    profile: ProfileEntity,
  ) {}
}
