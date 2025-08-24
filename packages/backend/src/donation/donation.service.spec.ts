import { Test, TestingModule } from '@nestjs/testing';
import { DonationService } from './donation.service';
import { DonationModule } from './donation.module';
import { DatabaseModule } from '../database/database.module';

describe('DonationService', () => {
  let service: DonationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DonationModule, DatabaseModule],
    }).compile();

    service = module.get<DonationService>(DonationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
