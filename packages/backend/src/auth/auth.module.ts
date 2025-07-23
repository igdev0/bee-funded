import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from './auth.config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    UserModule,
    CacheModule.register(),
    ConfigModule.forFeature(authConfig),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      inject: [ConfigService],
      useFactory: (args: ConfigService) => {
        return {
          secret: args.get('auth.secret'),
        };
      },
    }),
  ],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, JwtModule, CacheModule],
  controllers: [AuthController],
})
export class AuthModule {}
