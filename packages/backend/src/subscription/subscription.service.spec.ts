import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import SubscriptionEntity from './entities/subscription.entity';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { ChainModule } from '../chain/chain.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';
import { DonationModule } from '../donation/donation.module';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        AuthModule,
        ProfileModule,
        ChainModule,
        NotificationModule,
        MailModule,
        DonationModule,
        TypeOrmModule.forFeature([SubscriptionEntity]),
      ],
      providers: [SubscriptionService],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);

    await module.init();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
