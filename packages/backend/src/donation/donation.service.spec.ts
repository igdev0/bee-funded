import { Test, TestingModule } from '@nestjs/testing';
import { DonationService } from './donation.service';
import { DonationModule } from './donation.module';
import { DatabaseModule } from '../database/database.module';
import { DataSource } from 'typeorm';

describe('DonationService', () => {
  let module: TestingModule;
  let service: DonationService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DonationModule, DatabaseModule],
    }).compile();
    await module.init();
    service = module.get<DonationService>(DonationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    const source = module.get<DataSource>(DataSource);
    await source.destroy();
    await module.close();
  });
});
