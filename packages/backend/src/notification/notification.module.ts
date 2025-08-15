import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import NotificationEntity from './entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import NotificationSettingsEntity from './entities/notification-settings.entity';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, NotificationSettingsEntity]),
    AuthModule,
    UserModule,
    ProfileModule,
  ],
  providers: [NotificationService],
  exports: [
    NotificationService,
    TypeOrmModule.forFeature([NotificationEntity, NotificationSettingsEntity]),
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
