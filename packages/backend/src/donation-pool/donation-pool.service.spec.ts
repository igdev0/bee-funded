import { DonationPoolService } from './donation-pool.service';
import { Mocked, TestBed } from '@suites/unit';
import contractsConfig from '../contracts.config';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { DonationPoolEntity } from './entities/donation-pool.entity';
import CreateDonationPoolDto from './dto/create-donation-pool.dto';

describe('DonationPoolService', () => {
  let service: DonationPoolService;
  let configService: Mocked<ConfigService>;
  let donationPoolRepository: Mocked<Repository<DonationPoolEntity>>;
  beforeEach(async () => {
    const { unitRef, unit } =
      await TestBed.solitary(DonationPoolService).compile();

    service = unit;
    configService = unitRef.get(ConfigService);
    configService.get.mockReturnValue(contractsConfig());
    donationPoolRepository = unitRef.get('DonationPoolEntityRepository');
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('creating a donation pool', () => {
    it('should be able to create a main donation pool', async () => {
      await service.create({ kind: 'main' }, 'some-profile-id');

      expect(donationPoolRepository.create).toHaveBeenCalledWith({
        kind: 'main',
        profile: {
          id: 'some-profile-id',
        },
        status: 'publishing',
      });
    });

    it('should be able to create a donation pool for a specific objective', async () => {
      const data: CreateDonationPoolDto = {
        kind: 'objective',
        cap: 100000,
        image: 'https://somewhere.com',
        tags: ['tag'],
        description: 'Some description',
        title: 'Some title',
        valuation_token: '0x00000000000',
      };
      await service.create(data, 'some-profile-id');

      expect(donationPoolRepository.create).toHaveBeenCalledWith({
        ...data,
        profile: {
          id: 'some-profile-id',
        },
        status: 'publishing',
      });
    });
  });
});
