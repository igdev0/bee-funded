import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import SubscriptionEntity from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { ProfileService } from '../profile/profile.service';
import { ChainService } from '../chain/chain.service';
import { ChainConfig } from '../chain/chain.config';

@Injectable()
export class SubscriptionService implements OnModuleDestroy, OnModuleInit {
  chains: ChainConfig[];
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly profileService: ProfileService,
    private readonly chainService: ChainService,
  ) {
    this.chains = this.chainService.chains;
  }

  onModuleInit(): any {
    console.log(this.chains);
  }

  onModuleDestroy(): any {}
}
