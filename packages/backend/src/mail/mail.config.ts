import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs('mail', () => ({
  transport: {
    host: process.env.MAIL_HOST ?? 'localhost',
    port: process.env.MAIL_PORT ?? 1025,
    secure: process.env.MAIL_SECURE ?? true,
    jsonTransport: !!process.env.MAIL_PREVIEW,
    auth: {
      user: process.env.MAIL_AUTH_USER,
      pass: process.env.MAIL_AUTH_PASSWORD,
    },
  },
  template: {
    dir: `${process.cwd()}/src/mail/templates`,
  },
  preview: false,
  defaults: {
    from: process.env.MAIL_SENDER ?? 'noreply@dorultanianos.dev',
  },
}));
