import { Module } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { DonationPoolController } from './donation-pool.controller';
import { ConfigModule } from '@nestjs/config';
import ContractsConfig from '../contracts.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationPoolEntity } from './entities/donation-pool.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DonationPoolEntity]),
    ConfigModule.forFeature(ContractsConfig),
    AuthModule,
  ],
  providers: [DonationPoolService],
  controllers: [DonationPoolController],
})
export class DonationPoolModule {}
