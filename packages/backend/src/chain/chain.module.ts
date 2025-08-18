import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import ChainConfig from './chain.config';

@Module({
  imports: [ConfigModule.forFeature(ChainConfig)],
  exports: [ConfigModule],
})
export class ChainModule {}
