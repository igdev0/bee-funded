import { Test, TestingModule } from '@nestjs/testing';
import { DonationPoolController } from './donation-pool.controller';
import { ModuleMocker } from 'jest-mock';

describe('DonationPoolController', () => {
  let controller: DonationPoolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DonationPoolController],
    })
      .useMocker(() => new ModuleMocker(global))
      .compile();
    controller = module.get<DonationPoolController>(DonationPoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
