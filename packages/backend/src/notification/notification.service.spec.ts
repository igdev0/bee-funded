import { NotificationService } from './notification.service';
import { Mocked, TestBed } from '@suites/unit';
import { Repository } from 'typeorm';
import NotificationEntity from './entities/notification.entity';
import ProfileEntity from '../profile/entities/profile.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Mocked<Repository<NotificationEntity>>;

  beforeEach(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(NotificationService).compile();

    service = unit;
    notificationRepository = unitRef.get('NotificationEntityRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(notificationRepository).toBeDefined();
  });

  it('Should be able to send notification', async () => {
    const userId = 'some-user-id';
    const stream = service.connectUser(userId);
    const notification = {
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
    } as NotificationEntity;

    notificationRepository.create.mockReturnValue(notification);
    notificationRepository.save.mockResolvedValue(notification);
    const next = jest.spyOn(stream, 'next');

    await service.saveAndSend(userId, {
      type: 'donation_pool_created',
      metadata: {},
      actor: { id: 'some-id' } as ProfileEntity,
      title: 'Some title',
      message: 'Some message',
    });

    expect(next).toHaveBeenCalled();
  });
});
