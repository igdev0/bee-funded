import { Module } from '@nestjs/common';
import { ChainListenerService } from './chain-listener.service';
import { NotificationModule } from '../notification/notification.module';
import { ConfigModule } from '@nestjs/config';
import chainListenerConfig from './chain-listener.config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    NotificationModule,
    ConfigModule.forFeature(chainListenerConfig),
    UserModule,
  ],
  providers: [ChainListenerService],
})
export class ChainListenerModule {}
