import { Test, TestingModule } from '@nestjs/testing';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import DonationEntity from './entity/donation.entity';
import { ModuleMocker } from 'jest-mock';
import { ConfigModule } from '@nestjs/config';
import ChainConfig from '../chain/chain.config';

describe('DonationController', () => {
  let controller: DonationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule.forFeature(ChainConfig),
        TypeOrmModule.forFeature([DonationEntity]),
      ],
      controllers: [DonationController],
      providers: [DonationService],
    })
      .useMocker(() => {
        return new ModuleMocker(global);
      })
      .compile();

    controller = module.get<DonationController>(DonationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
