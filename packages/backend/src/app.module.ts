import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './user/entities/user.entity';
import { DatabaseType } from 'typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DonationPoolModule } from './donation-pool/donation-pool.module';
import { DonationPool } from './donation-pool/entities/donation-pool.entity';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config?.get('REDIS_URL') ?? 'redis://localhost:6379',
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        const DB_TYPE: DatabaseType = config?.get('DB_TYPE') ?? 'postgres';
        const DB_HOST: string = config?.get('DB_HOST') ?? 'localhost';
        const DB_PORT: number = config?.get('DB_PORT') ?? 5432;
        const DB_DATABASE: string = config?.get('DB_DATABASE') ?? 'yourdb';
        const DB_USERNAME: string = config?.get('DB_USERNAME') ?? 'admin';
        const DB_PASSWORD: string = config?.get('DB_PASSWORD') ?? 'admin';
        return {
          type: DB_TYPE as keyof object, // or mysql, sqlite, etc.
          host: DB_HOST,
          port: DB_PORT,
          username: DB_USERNAME,
          password: DB_PASSWORD,
          database: DB_DATABASE,
          entities: [User, DonationPool],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UserModule,
    DonationPoolModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
