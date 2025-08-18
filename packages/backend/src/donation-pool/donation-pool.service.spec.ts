import { DonationPoolService } from './donation-pool.service';
import { Mocked, TestBed } from '@suites/unit';
import contractsConfig from '../chain/chain.config';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { DonationPoolEntity } from './entities/donation-pool.entity';
import CreateDonationPoolDto from './dto/create-donation-pool.dto';
import UpdateDonationPoolDto from './dto/update-donation-pool.dto';

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

    it('should be able to update a donation pool', async () => {
      // @ts-expect-error Ignore, this is just a mock
      donationPoolRepository.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              andWhere: jest.fn().mockReturnValue({
                andWhere: jest.fn().mockReturnValue({
                  execute: jest.fn().mockResolvedValue({}),
                }),
              }),
            }),
          }),
        }),
      });
      const updateValues: UpdateDonationPoolDto = {
        title: 'Updated title',
      };

      await service.update('some-uuid', 'profile-id', updateValues);

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        donationPoolRepository.createQueryBuilder().update().set,
      ).toHaveBeenCalledWith(updateValues);
    });

    it('should be able to retrieve owned donation pool', async () => {
      // @ts-expect-error Ignore, this is just a mock
      donationPoolRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            andWhere: jest.fn().mockReturnValue({
              getOneOrFail: jest.fn().mockResolvedValue({}),
            }),
          }),
        }),
      });
      const id = 'some-donation-pool-id';
      const profileId = 'some-profile-id';
      await service.getOwned(id, profileId);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const where = donationPoolRepository
        .createQueryBuilder()
        .leftJoin('profile', 'profile').where;
      expect(where).toHaveBeenCalledWith('profile.id = :profileId', {
        profileId,
      });

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        where('profile.id = :profileId', { profileId }).andWhere,
      ).toHaveBeenCalledWith('pool.id = :id', { id });
    });

    it('should be able to retrieve owned donation pool', async () => {
      // @ts-expect-error Ignore, this is just a mock
      donationPoolRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          getMany: jest.fn().mockResolvedValue({}),
        }),
      });
      const profileId = 'some-profile-id';
      await service.getAllOwned(profileId);

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        donationPoolRepository.createQueryBuilder().where,
      ).toHaveBeenCalledWith('profileId = :profileId', {
        profileId,
      });
    });

    it('should be able to delete a owned donation pool', async () => {
      const deleteFn = jest.fn();
      const andWhere = jest.fn();
      const where = jest.fn();
      // @ts-expect-error Ignore, this is just a mock.
      donationPoolRepository.createQueryBuilder.mockReturnValue({
        where: where.mockReturnValue({
          andWhere: andWhere.mockReturnValue({
            delete: deleteFn.mockReturnValue({
              execute: jest.fn().mockResolvedValue({ affected: 1 }),
            }),
          }),
        }),
      });
      const id = 'some-donation-pool-id';
      const profileId = 'some-profile-id';
      await service.deleteOwned(id, profileId);

      expect(where).toHaveBeenCalledWith('id = :id', { id });

      expect(andWhere).toHaveBeenCalledWith('profileId = :profileId', {
        profileId,
      });
    });
  });
});
