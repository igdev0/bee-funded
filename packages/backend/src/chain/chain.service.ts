import { Injectable } from '@nestjs/common';
import { ChainConfig } from './chain.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChainService {
  constructor(private readonly configService: ConfigService) {}
  getChainById(id: number): ChainConfig {
    const chains = this.configService.get<ChainConfig[]>('chains');
    if (!chains) {
      throw new Error('Chains are not set');
    }
    const chain = chains.find((chain) => chain.chainId === id) ?? null;

    if (!chain) {
      throw new Error(`Chain ${id} not found`);
    }

    return chain;
  }
}
