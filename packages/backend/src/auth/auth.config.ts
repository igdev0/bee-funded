import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs('auth', () => ({
  refreshTokenTTL: 60 * 60 * 24 * 7, // 7 days in seconds
  secret: process.env.AUTH_SECRET ?? 'Not set yet',
  accessTokenTTL: 60 * 15, // 15 mins in seconds
  refreshTokenExpiryThreshold: 60 * 60 * 24, // 24 hours
  secure: process.env.NODE_ENV === 'production',
}));
