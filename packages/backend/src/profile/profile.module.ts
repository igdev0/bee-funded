import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import ProfileEntity from './entities/profile.entity';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MulterModule } from '@nestjs/platform-express';
import * as process from 'node:process';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      dest: process.cwd() + 'uploads/',
    }),
    CacheModule.register(),
    TypeOrmModule.forFeature([ProfileEntity]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
