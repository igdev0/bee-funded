import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs('db', () => {
  return {
    type: process.env.DB_TYPE ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ?? 5432,
    database: process.env.DB_DATABASE ?? 'example',
    username: process.env.DB_USERNAME ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin',
    sync: true,
  };
});
