import { Module } from '@nestjs/common';
import { BlockchainListenerService } from './blockchain-listener.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [BlockchainListenerService],
})
export class BlockchainListenerModule {}
