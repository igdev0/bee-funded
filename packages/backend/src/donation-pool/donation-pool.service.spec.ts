import { DonationPoolService } from './donation-pool.service';
import { TestBed, Mocked } from '@suites/unit';
import contractsConfig from '../contracts.config';
import { ConfigService } from '@nestjs/config';

describe('DonationPoolService', () => {
  let service: DonationPoolService;
  let configService: Mocked<ConfigService>;

  beforeEach(async () => {
    const { unitRef, unit } =
      await TestBed.solitary(DonationPoolService).compile();

    service = unit;
    configService = unitRef.get(ConfigService);
    configService.get.mockReturnValue(contractsConfig());
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
