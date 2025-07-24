import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import ProfileEntity from './entities/profile.entity';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as fs from 'node:fs';
import * as process from 'node:process';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = `${process.cwd()}/uploads/${req.user!.profile.id}`;
    const exists = fs.existsSync(dir);
    if (!exists) {
      fs.mkdirSync(dir);
    }
    cb(null, `uploads/${req.user!.profile.id}`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + `${file.originalname}`);
  },
});

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage,
    }),
    CacheModule.register(),
    TypeOrmModule.forFeature([ProfileEntity]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
