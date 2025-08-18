import { Module } from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import DonationEntity from './entity/donation.entity';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [ChainModule, TypeOrmModule.forFeature([DonationEntity])],
  providers: [DonationService],
  controllers: [DonationController],
})
export class DonationModule {}
