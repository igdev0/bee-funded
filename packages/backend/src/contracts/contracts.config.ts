import { registerAs } from '@nestjs/config';

export default registerAs('contracts', () => {
  return {
    tokenAddress: '0x067f56668eb97F2feE94822BAe55B2bf3c3Dab55',
    tokenChainId: '',
  };
});
