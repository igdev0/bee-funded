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
import { DonationPoolModule } from '../donation-pool/donation-pool.module';
import { TokenizerModule } from '../tokenizer/tokenizer.module';

@Module({
  imports: [
    ChainModule,
    ProfileModule,
    AuthModule,
    TypeOrmModule.forFeature([SubscriptionEntity]),
    MailModule,
    NotificationModule,
    DonationModule,
    DonationPoolModule,
    TokenizerModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
