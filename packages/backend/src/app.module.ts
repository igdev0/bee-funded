import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { ProfileModule } from './profile/profile.module';
import { MailModule } from './mail/mail.module';
import { DonationPoolModule } from './donation-pool/donation-pool.module';
import { DatabaseModule } from './database/database.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { TokenizerModule } from './tokenizer/tokenizer.module';
import { ChainModule } from './chain/chain.module';
import { DonationModule } from './donation/donation.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    DatabaseModule,
    NotificationModule,
    ProfileModule,
    MailModule,
    DonationPoolModule,
    DatabaseModule,
    FileStorageModule,
    TokenizerModule,
    ChainModule,
    DonationModule,
    SubscriptionModule,
  ],
})
export class AppModule {}
