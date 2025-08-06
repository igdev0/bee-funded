import { Module } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { DonationPoolController } from './donation-pool.controller';
import { ConfigModule } from '@nestjs/config';
import ContractsConfig from '../contracts.config';

@Module({
  imports: [ConfigModule.forFeature(ContractsConfig)],
  providers: [DonationPoolService],
  controllers: [DonationPoolController],
})
export class DonationPoolModule {}
