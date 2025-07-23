import { NotificationService } from './notification.service';
import { Mocked, TestBed } from '@suites/unit';
import { Repository } from 'typeorm';
import NotificationEntity from './entities/notification.entity';

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
      id: 'some-uuid',
      type: 'system',
      is_read: false,
      title: 'Some title',
      message: 'Some message',
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {},
    } as NotificationEntity;

    notificationRepository.create.mockReturnValue(notification);
    notificationRepository.save.mockResolvedValue(notification);
    const next = jest.spyOn(stream, 'next');

    await service.saveAndSend(userId, {
      type: 'system',
      metadata: {},
      title: 'Some title',
      message: 'Some message',
    });

    expect(next).toHaveBeenCalled();
  });
});
