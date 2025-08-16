import { Test, TestingModule } from '@nestjs/testing';
import { TokenizerService } from './tokenizer.service';

describe('TokenizerService', () => {
  let service: TokenizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenizerService],
    }).compile();

    service = module.get<TokenizerService>(TokenizerService);
  });

  it('Should format string with array of args', () => {
    expect(
      service.format('Hello {0}, you have {1} new messages', ['Alice', 5]),
    ).toBe('Hello Alice, you have 5 new messages');
  });

  it('Should format string with key/value args', () => {
    expect(service.format('Hello {name}!', { name: 'Alice' })).toBe(
      'Hello Alice!',
    );
  });
});
