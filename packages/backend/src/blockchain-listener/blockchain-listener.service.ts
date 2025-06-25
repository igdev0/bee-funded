import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, WebSocketProvider } from 'ethers';
import { DonationPoolService } from '../donation-pool/donation-pool.service';
import { UserService } from '../user/user.service';
import { DonationPoolStatus } from '../donation-pool/entities/donation-pool.entity';
import {
  NotificationEvents,
  NotificationsService,
} from '../notifications/notifications.service';

@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainListenerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly donationPoolService: DonationPoolService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<any> {
    if (!this.configService.get('ALCHEMY_PRIVATE_KEY')) {
      throw new Error('Missing ETHEREUM_NODE_WS_URL environment variable');
    }

    const ALCHEMY_PRIVATE_KEY = this.configService.get(
      'ALCHEMY_PRIVATE_KEY',
    ) as string;

    const provider = new WebSocketProvider(
      `wss://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_PRIVATE_KEY}`,
    );
    const contractAddress = this.configService.get(
      'contracts.tokenAddress',
    ) as string;
    const contractAbi = this.configService.get('contracts.abi') as [];

    const contract = new Contract(contractAddress, contractAbi, provider);
    try {
      await contract.on(
        'DonationPoolCreated',
        (poolId: bigint, address: string) => {
          this.logger.log(
            `New new pool created, with id: ${poolId} address: ${address}`,
          );

          this.userService
            .findUserByAddress(address)
            .then((user) => {
              if (!user) {
                return this.logger.warn(
                  "Can't find user with address " + address,
                );
              }
              this.donationPoolService
                .findOwnedByChainId(Number(poolId), user.id as string)
                .then((pool) => {
                  if (!pool) {
                    return this.logger.log(
                      `Failed to find user with pool chain id ${poolId}`,
                    );
                  }
                  this.donationPoolService
                    .update(pool?.id as string, {
                      status: DonationPoolStatus.PUBLISHED,
                    })
                    .then(() => {
                      this.logger.log(
                        `Emitting new notification:\n Pool "${pool?.title}" has been published on chain`,
                      );
                      this.notificationsService.sendToUser(user.id as string, {
                        type: NotificationEvents.POOL_PUBLISHED,
                        data: {
                          message: `Pool "${pool?.title}" has been published on chain`,
                        },
                      });
                    })
                    .catch((err) => {
                      this.logger.error(err);
                    });
                })
                .catch((err) => {
                  this.logger.error(
                    `error occurred while trying to find pool owned by user ${err}`,
                  );
                });
            })
            .catch((err) => {
              this.logger.error(
                `Error occurred while trying to get the user: ${err}`,
              );
            });
        },
      );
    } catch (error) {
      this.logger.log(
        'There was an error while trying to connect to blockchain listener',
      );
      this.logger.error(error);
    }
  }
}
