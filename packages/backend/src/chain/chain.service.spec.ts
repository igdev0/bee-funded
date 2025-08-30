import { Test, TestingModule } from '@nestjs/testing';
import { ChainService } from './chain.service';
import { ConfigModule } from '@nestjs/config';
import ChainConfig from './chain.config';

describe('ChainService', () => {
  let service: ChainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(ChainConfig)],
      providers: [ChainService],
    }).compile();

    service = module.get<ChainService>(ChainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
