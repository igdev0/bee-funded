import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketProvider } from 'ethers';

@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(BlockchainListenerService.name);

  onModuleInit(): any {
    if (!this.configService.get('ALCHEMY_PRIVATE_KEY')) {
      throw new Error('Missing ETHEREUM_NODE_WS_URL environment variable');
    }
    const ALCHEMY_PRIVATE_KEY = this.configService.get(
      'ALCHEMY_PRIVATE_KEY',
    ) as string;

    const provider = new WebSocketProvider(
      `wss://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_PRIVATE_KEY}`,
    );


    // provider.on("", () => {
    //
    // })
  }
}
