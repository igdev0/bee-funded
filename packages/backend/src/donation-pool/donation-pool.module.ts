import { Module } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { DonationPoolController } from './donation-pool.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationPoolEntity } from './entities/donation-pool.entity';
import { AuthModule } from '../auth/auth.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { ProfileModule } from '../profile/profile.module';
import { MailModule } from '../mail/mail.module';
import DonationPoolConfig from './donation-pool.config';
import { NotificationModule } from '../notification/notification.module';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DonationPoolEntity]),
    FileStorageModule,
    ChainModule,
    ConfigModule.forFeature(DonationPoolConfig),
    NotificationModule,
    AuthModule,
    ProfileModule,
    MailModule,
  ],
  providers: [DonationPoolService],
  controllers: [DonationPoolController],
})
export class DonationPoolModule {}
