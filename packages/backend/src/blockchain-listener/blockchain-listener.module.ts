import { Module } from '@nestjs/common';
import { BlockchainListenerService } from './blockchain-listener.service';
import { ConfigModule } from '@nestjs/config';
import contractsConfig from '../contracts/contracts.config';
import { DonationPoolModule } from '../donation-pool/donation-pool.module';
import { UserModule } from '../user/user.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forFeature(contractsConfig),
    DonationPoolModule,
    UserModule,
    NotificationsModule,
  ],
  providers: [BlockchainListenerService],
})
export class BlockchainListenerModule {}
