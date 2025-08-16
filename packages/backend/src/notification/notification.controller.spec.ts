import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { ModuleMocker } from 'jest-mock';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { NotificationService } from './notification.service';
import { UserI } from '../user/user.interface';
import NotificationEntity from './entities/notification.entity';
import ProfileEntity from '../profile/entities/profile.entity';
import { ConfigModule } from '@nestjs/config';
import NotificationConfig from './notification.config';

const user: UserI = {
  id: 'user-id',
  profile: new ProfileEntity(),
  notifications: [],
  wallet_address: '0x000',
  created_at: new Date(),
  updated_at: new Date(),
};
const notificationRes = {
  data: [
    {
      id: 'some-id',
      metadata: {},
      actor: { id: 'some-actor-id' } as ProfileEntity,
      profile: { id: 'some-profile-id' } as ProfileEntity,
      message: 'Some message',
      updated_at: new Date(),
      created_at: new Date(),
      title: 'Some title',
      type: 'donation_pool_created',
      is_read: false,
    },
  ] as NotificationEntity[],
  offset: 0,
  limit: 15,
  count: 1,
};

const typeormModule = new ModuleMocker(global);
const authModule = new ModuleMocker(global);
const userModule = new ModuleMocker(global);
describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(NotificationConfig)],
      controllers: [NotificationController],
      providers: [NotificationService],
    })
      .useMocker((token) => {
        if (token === TypeOrmModule) {
          return typeormModule;
        }
        if (token === AuthModule) {
          return authModule;
        }

        if (token === UserModule) {
          return userModule;
        }
        return new ModuleMocker(global);
      })
      .compile();
    service = module.get(NotificationService);
    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be able to get notifications', async () => {
    const res = jest
      .spyOn(service, 'getNotifications')
      .mockReturnValue(Promise.resolve(notificationRes as keyof object));
    await controller.getNotifications(user);
    expect(res).toHaveBeenCalledWith(user.id, 0, 20); // defaults
  });

  it('should not be able to get more than 15 results per query ', async () => {
    const res = jest
      .spyOn(service, 'getNotifications')
      .mockReturnValue(Promise.resolve(notificationRes));
    await controller.getNotifications(user, 10, 1000);
    expect(res).toHaveBeenCalledWith(user.id, 10, 20);
  });
});
