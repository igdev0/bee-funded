import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import NotificationEntity from './entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import NotificationSettingsEntity from './entities/notification-settings.entity';
import { ProfileModule } from '../profile/profile.module';
import { MailModule } from '../mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import NotificationConfig from './notification.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, NotificationSettingsEntity]),
    AuthModule,
    UserModule,
    ProfileModule,
    MailModule,
    ConfigModule.forFeature(NotificationConfig),
  ],
  providers: [NotificationService],
  exports: [
    NotificationService,
    TypeOrmModule.forFeature([NotificationEntity, NotificationSettingsEntity]),
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
