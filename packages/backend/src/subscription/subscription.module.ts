import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import SubscriptionEntity from './entities/subscription.entity';
import { ChainModule } from '../chain/chain.module';
import { ProfileModule } from '../profile/profile.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { DonationModule } from '../donation/donation.module';

@Module({
  imports: [
    ChainModule,
    ProfileModule,
    AuthModule,
    TypeOrmModule.forFeature([SubscriptionEntity]),
    MailModule,
    NotificationModule,
    DonationModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
