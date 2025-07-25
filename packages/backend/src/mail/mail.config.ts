import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs('mail', () => ({
  transport: {
    host: process.env.MAIL_HOST ?? 'localhost',
    port: process.env.MAIL_PORT ?? 1025,
    secure: process.env.MAIL_SECURE ?? true,
    auth: {
      user: process.env.MAIL_AUTH_USER,
      pass: process.env.MAIL_AUTH_PASSWORD,
    },
  },
  preview: process.env.NODE_ENV !== 'production',
  template: {
    dir: `${process.cwd()}/templates`,
  },
  options: {
    defaults: {
      from: '"No Reply" <no-reply@localhost>',
    },
  },
}));
