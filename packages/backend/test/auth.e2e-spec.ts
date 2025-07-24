import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseType, DataSource } from 'typeorm';
import { UserEntity } from '../src/user/entities/user.entity';
import ProfileEntity from '../src/profile/entities/profile.entity';
import * as request from 'supertest';
import DatabaseConfig from '../src/database.config';
import NotificationEntity from '../src/notification/entities/notification.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule.forFeature(DatabaseConfig)],
          inject: [ConfigService],
          useFactory(config: ConfigService) {
            const type = config.get<DatabaseType>('db.type');
            const host: string = config.get('db.host') ?? 'localhost';
            const port: number = config.get('db.port') ?? 5432;
            const database: string = config.get('db.database') ?? 'yourdb';
            const username: string = config.get('db.username') ?? 'admin';
            const password: string = config.get('db.password') ?? 'admin';
            const synchronize: boolean = config.get('db.sync') ?? false;
            if (!type) {
              throw new Error('Database type must be set');
            }
            return {
              type: type as keyof object, // or mysql, sqlite, etc.
              host,
              port,
              username,
              password,
              database,
              synchronize,
              entities: [UserEntity, ProfileEntity, NotificationEntity],
            };
          },
        }),
        AuthModule,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should be able to get a nonce', () => {
    request(app.getHttpServer()).get('/auth/nonce').expect(200);
  });

  afterAll(async () => {
    const datasource = app.get(DataSource);
    await datasource.dropDatabase();
  });
});
