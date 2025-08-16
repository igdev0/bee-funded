import { registerAs } from '@nestjs/config';

export interface DonationPoolConfig {
  baseViewDonationPoolPath: string;
}
export default registerAs(
  'donation-pool',
  () =>
    ({
      baseViewDonationPoolPath:
        process.env.DONATION_POOL_BASE_PATH ?? '/donation-pool',
    }) as DonationPoolConfig,
);
