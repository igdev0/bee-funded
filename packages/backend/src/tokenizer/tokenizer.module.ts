import { Module } from '@nestjs/common';
import { TokenizerService } from './tokenizer.service';

@Module({
  providers: [TokenizerService]
})
export class TokenizerModule {}
