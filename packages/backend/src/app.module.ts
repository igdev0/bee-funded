import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseType } from 'typeorm';
import { UserEntity } from './user/entities/user.entity';
import { NotificationModule } from './notification/notification.module';
import { ChainListenerModule } from './chain-listener/chain-listener.module';
import { ProfileModule } from './profile/profile.module';
import databaseConfig from './database.config';
import NotificationEntity from './notification/entities/notification.entity';
import ProfileEntity from './profile/entities/profile.entity';

@Module({
  imports: [
    AuthModule,
    UserModule,
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
          entities: [UserEntity, ProfileEntity, NotificationEntity],
        };
      },
    }),
    NotificationModule,
    ChainListenerModule,
    ProfileModule,
  ],
})
export class AppModule {}
