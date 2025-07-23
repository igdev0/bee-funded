import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { getMockRes } from '@jest-mock/express';
import { ModuleMocker } from 'jest-mock';
import { UserModule } from '../user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import authConfig from './auth.config';
import { HttpStatus } from '@nestjs/common';

const userModule = new ModuleMocker(global);
const typeormModule = new ModuleMocker(global);
const jwtModule = new ModuleMocker(global);

jest.mock('siwe', () => ({
  generateNonce: jest.fn(() => 'mocked-nonce'),
  SiweMessage: jest.fn().mockImplementation(() => ({
    nonce: 'mocked-nonce',
    address: '0xMockedAddress',
    verify: jest.fn().mockResolvedValue({ success: true }), // or customize this
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;

  const { res, clearMockRes } = getMockRes();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(authConfig), CacheModule.register()],
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === UserModule) {
          return userModule;
        }
        if (token === TypeOrmModule) {
          return typeormModule;
        }
        if (token === JwtModule) {
          return jwtModule;
        }
        return new ModuleMocker(global);
      })
      .compile();
    clearMockRes();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should generate a new nonce', async () => {
    await controller.getNonce(res);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.send).toHaveBeenCalledWith('mocked-nonce');
  });
});
