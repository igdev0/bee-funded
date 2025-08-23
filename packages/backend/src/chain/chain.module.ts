import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChainService } from './chain.service';
import ChainConfig from './chain.config';

@Module({
  imports: [ConfigModule.forFeature(ChainConfig)],
  providers: [ChainService],
  exports: [ConfigModule, ChainService],
})
export class ChainModule {}
