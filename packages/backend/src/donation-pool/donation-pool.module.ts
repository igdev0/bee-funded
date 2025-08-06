import { Module } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { DonationPoolController } from './donation-pool.controller';

@Module({
  providers: [DonationPoolService],
  controllers: [DonationPoolController],
})
export class DonationPoolModule {}
