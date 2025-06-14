import { Test, TestingModule } from '@nestjs/testing';
import { DonationPoolController } from './donation-pool.controller';
import { DonationPoolService } from './donation-pool.service';

describe('DonationPoolController', () => {
  let controller: DonationPoolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationPoolController],
      providers: [DonationPoolService],
    }).compile();

    controller = module.get<DonationPoolController>(DonationPoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
