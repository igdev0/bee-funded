import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import SubscriptionEntity from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class SubscriptionService implements OnModuleDestroy, OnModuleInit {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly profileService: ProfileService,
  ) {}

  onModuleInit(): any {}

  onModuleDestroy(): any {}
}
