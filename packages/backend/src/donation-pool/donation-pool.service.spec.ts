import { Test, TestingModule } from '@nestjs/testing';
import { DonationPoolService } from './donation-pool.service';

describe('DonationPoolService', () => {
  let service: DonationPoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonationPoolService],
    }).compile();

    service = module.get<DonationPoolService>(DonationPoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
