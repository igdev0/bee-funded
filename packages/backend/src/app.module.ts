import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { ProfileModule } from './profile/profile.module';
import { MailModule } from './mail/mail.module';
import { DonationPoolModule } from './donation-pool/donation-pool.module';
import { DatabaseModule } from './database/database.module';

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
  ],
})
export class AppModule {}
