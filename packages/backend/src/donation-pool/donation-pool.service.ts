import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainConfig } from '../contracts.config';
import { Contract, WebSocketProvider } from 'ethers';

@Injectable()
export class DonationPoolService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const chains = this.config.get<ChainConfig[]>('contracts');
    if (!chains) {
      throw new Error('Contracts config must be set');
    }

    for (const chain of chains) {
      const provider = new WebSocketProvider(chain.rpcUrl);

      const { abi: beeFundedCoreAbi, address: beeFundedCoreAddress } =
        chain.contracts.BeeFundedCore;

      const contract = new Contract(
        beeFundedCoreAddress,
        beeFundedCoreAbi,
        provider,
      );

      await contract.on('DonationPoolCreated', () => {
        console.log('DonationPoolCreated');
      });
    }
  }
}
