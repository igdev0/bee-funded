import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import NotificationEntity from './entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    AuthModule,
    UserModule,
  ],
  providers: [NotificationService],
  exports: [
    NotificationService,
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
