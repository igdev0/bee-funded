import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { ChainConfigI } from './chain-listener.interface';
import { ethers, WebSocketProvider } from 'ethers';
import { UserService } from '../user/user.service';

@Injectable()
export class ChainListenerService implements OnModuleInit {
  logger = new Logger('ChainListenerService');

  constructor(
    private readonly notificationService: NotificationService,
    private readonly user: UserService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<any> {
    const chains = this.config.get<ChainConfigI[]>('chain-listener.chains');
    if (!chains) {
      throw new Error('Chains is not configured');
    }

    for (const chain of chains) {
      const provider = new WebSocketProvider(chain.wsUrl);
      const counter = new ethers.Contract(
        chain.contracts.Counter.address,
        chain.contracts.Counter.abi,
        provider,
      );

      await counter.on(
        'Incremented',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (address: string, value: string) => {
          const user = await this.user.findOneByWalletAddress(address);
          if (user) {
            await this.notificationService.saveAndSend(user.id, {
              title: 'Counter incremented',
              metadata: {},
              message: `The counter has incremented by one, the current value is ${value}`,
              type: 'on_chain',
            });
          }
        },
      );

      await counter.on(
        'Decremented',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (address: string, value: string) => {
          const user = await this.user.findOneByWalletAddress(address);
          if (user) {
            await this.notificationService.saveAndSend(user.id, {
              title: 'Counter decremented',
              metadata: {},
              message: `The counter has decremented by one, the current value is ${value}`,
              type: 'on_chain',
            });
          }
        },
      );
    }
  }
}
