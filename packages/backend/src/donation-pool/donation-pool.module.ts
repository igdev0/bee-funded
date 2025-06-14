import { Module } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { DonationPoolController } from './donation-pool.controller';

@Module({
  controllers: [DonationPoolController],
  providers: [DonationPoolService],
})
export class DonationPoolModule {}
