import { Test, TestingModule } from '@nestjs/testing';
import { DonationPoolController } from './donation-pool.controller';

describe('DonationPoolController', () => {
  let controller: DonationPoolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationPoolController],
    }).compile();

    controller = module.get<DonationPoolController>(DonationPoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
