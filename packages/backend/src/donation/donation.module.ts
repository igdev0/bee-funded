import { Module } from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import DonationEntity from './entity/donation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DonationEntity])],
  providers: [DonationService],
  controllers: [DonationController],
})
export class DonationModule {}
