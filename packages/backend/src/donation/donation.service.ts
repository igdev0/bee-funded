import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DonationEntity from './entity/donation.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChainConfig } from '../chain/chain.config';
import { Contract, WebSocketProvider } from 'ethers';

@Injectable()
export class DonationService implements OnModuleInit, OnModuleDestroy {
  private chains: ChainConfig[];
  private providers: WebSocketProvider[];

  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepository: Repository<DonationEntity>,
    private readonly chainConfig: ConfigService,
  ) {
    const chains = this.chainConfig.get<ChainConfig[]>('chains');
    if (!chains) {
      throw new Error('Chain configuration not set');
    }
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
   * Cleans up all WebSocket providers that were initialized during `onModuleInit`.
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

  private onDonationSuccess(
    poolId: bigint,
    donor: string,
    token: string,
    amount: bigint,
    message: string,
  ) {}
}
