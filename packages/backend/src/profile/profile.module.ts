import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import ProfileEntity from './entities/profile.entity';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MailModule } from '../mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { FileStorageModule } from '../file-storage/file-storage.module';
import NotificationSettingsEntity from '../notification/entities/notification-settings.entity';
import { ProfileSubscriber } from './profile.subscriber';

@Module({
  imports: [
    AuthModule,
    CacheModule.register(),
    FileStorageModule,
    MailModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([ProfileEntity, NotificationSettingsEntity]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileSubscriber],
})
export class ProfileModule {}
