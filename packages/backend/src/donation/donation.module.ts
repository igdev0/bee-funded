import { Module } from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import DonationEntity from './entity/donation.entity';
import { ChainModule } from '../chain/chain.module';
import { ProfileModule } from '../profile/profile.module';
import { DonationPoolModule } from '../donation-pool/donation-pool.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ChainModule,
    ProfileModule,
    UserModule,
    DonationPoolModule,
    NotificationModule,
    MailModule,
    TypeOrmModule.forFeature([DonationEntity]),
  ],
  providers: [DonationService],
  controllers: [DonationController],
  exports: [DonationService],
})
export class DonationModule {}
