import { Module } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { DonationPoolController } from './donation-pool.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationPool } from './entities/donation-pool.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([DonationPool])],
  controllers: [DonationPoolController],
  providers: [DonationPoolService],
  exports: [DonationPoolService],
})
export class DonationPoolModule {}
