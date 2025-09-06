import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import SubscriptionEntity from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { ProfileService } from '../profile/profile.service';
import { ChainService } from '../chain/chain.service';
import { ChainConfig } from '../chain/chain.config';
import { Contract, WebSocketProvider } from 'ethers/lib.esm';
import SaveSubscriptionDto from './dto/save-subscription.dto';
import { DonationPoolService } from '../donation-pool/donation-pool.service';

@Injectable()
export class SubscriptionService implements OnModuleDestroy, OnModuleInit {
  chains: ChainConfig[];
  providers: WebSocketProvider[];

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly profileService: ProfileService,
    private readonly poolService: DonationPoolService,
    private readonly chainService: ChainService,
  ) {
    this.chains = this.chainService.chains;
  }

  async save(payload: SaveSubscriptionDto) {
    const poolId = await this.poolService.getPoolIdByChainId(payload.pool_id);
    const entity = this.subscriptionRepository.create({
      remaining_payments: payload.remaining_payments,
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
   * @param duration – The total duration of the subscription.
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
    duration: bigint,
    deadline: bigint,
  ) {
    await this.save({
      deadline: Number(deadline),
      beneficiary,
      token,
      amount: amount.toString(),
      subscription_id: Number(subscriptionId),
      remaining_payments: Number(duration),
      interval: Number(interval),
      subscriber,
      pool_id: Number(poolId),
    });
  }

  async onUnsubscribe(subscriptionId: bigint, poolId: bigint) {
    await this.subscriptionRepository.update(
      {
        on_chain_subscription_id: Number(subscriptionId),
      },
      {
        active: false,
        next_payment_time: 0,
      },
    );
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

  async onModuleInit(): Promise<void> {
    for (const chain of this.chains) {
      const provider = new WebSocketProvider(chain.wsUrl);
      const contract = new Contract(
        chain.contracts.DonationManager.address,
        chain.contracts.DonationManager.abi,
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

      await contract.on(
        'SubscriptionPaymentSuccess',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.onSubscriptionPaymentSuccess.bind(this),
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
}
