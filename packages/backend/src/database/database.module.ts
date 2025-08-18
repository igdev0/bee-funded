import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseType } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import ProfileEntity from '../profile/entities/profile.entity';
import NotificationEntity from '../notification/entities/notification.entity';
import databaseConfig from './database.config';
import { DonationPoolEntity } from '../donation-pool/entities/donation-pool.entity';
import NotificationSettingsEntity from '../notification/entities/notification-settings.entity';
import DonationEntity from '../donation/entity/donation.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        const type = config.get<DatabaseType>('db.type') as DatabaseType;
        const host = config.get<string>('db.host') ?? 'localhost';
        const port = config.get<number>('db.port') ?? 5432;
        const database = config.get<string>('db.database') ?? 'yourdb';
        const username = config.get<string>('db.username') ?? 'admin';
        const password = config.get<string>('db.password') ?? 'admin';
        const synchronize = config.get<boolean>('db.sync') ?? false;
        if (!type) {
          throw new Error('Database type must be set');
        }
        return {
          type: type as keyof object, // or mysql, sqlite, etc.
          host,
          port,
          username,
          password,
          database,
          synchronize,
          entities: [
            UserEntity,
            ProfileEntity,
            NotificationEntity,
            NotificationSettingsEntity,
            DonationPoolEntity,
            DonationEntity,
          ],
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
