import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseType } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import ProfileEntity from '../profile/entities/profile.entity';
import NotificationEntity from '../notification/entities/notification.entity';
import databaseConfig from './database.config';
import { DonationPoolEntity } from '../donation-pool/entities/donation-pool.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        const type = config.get<DatabaseType>('db.type');
        const host: string = config.get('db.host') ?? 'localhost';
        const port: number = config.get('db.port') ?? 5432;
        const database: string = config.get('db.database') ?? 'yourdb';
        const username: string = config.get('db.username') ?? 'admin';
        const password: string = config.get('db.password') ?? 'admin';
        const synchronize: boolean = config.get('db.sync') ?? false;
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
            DonationPoolEntity,
          ],
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
