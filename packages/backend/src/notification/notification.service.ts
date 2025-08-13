import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { NotificationI } from './notification.interface';
import { InjectRepository } from '@nestjs/typeorm';
import NotificationEntity from './entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import NotificationSettingsEntity from './entities/notification-settings.entity';

@Injectable()
export class NotificationService {
  // A map to hold active SSE streams per connected user
  private userStreams = new Map<string, Subject<MessageEvent<NotificationI>>>();

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationSettingsEntity)
    private readonly notificationSettingsRepository: Repository<NotificationSettingsEntity>,
  ) {}

  /**
   * Establishes a new SSE stream for a user and stores it in memory.
   * Called when a client connects to the SSE endpoint.
   * @param profileID - The user's profile ID
   * @returns A Subject stream to send MessageEvents to the user
   */
  connectUser(profileID: string): Subject<MessageEvent<NotificationI>> {
    const stream = new Subject<MessageEvent<NotificationI>>();
    this.userStreams.set(profileID, stream);
    return stream;
  }

  /**
   * Disconnects a user by completing their stream and removing it from memory.
   * Called when a client disconnects from the SSE endpoint.
   * @param profileId - The user's profile ID
   */
  disconnectUser(profileId: string) {
    const stream = this.userStreams.get(profileId);
    if (stream) {
      stream.complete();
      this.userStreams.delete(profileId);
    }
  }

  /**
   * Saves a new notification in the database and pushes it to the user's SSE stream if connected.
   * @param profileId - The user profile to send the notification to
   * @param data - The notification payload (excluding id, created_at, updated_at)
   */
  async saveAndSend(
    profileId: string,
    data: Omit<NotificationI, 'id' | 'created_at' | 'updated_at' | 'is_read'>,
  ) {
    const stream = this.userStreams.get(profileId);
    const entity = this.notificationRepository.create({
      ...data,
      is_read: false,
      profile: { id: profileId },
    });
    const saved = await this.notificationRepository.save(entity);

    // Send the notification over SSE if the user is connected
    if (stream) {
      stream.next(new MessageEvent(data.type, { data: saved }));
    }
  }

  /**
   * Marks a notification as read in the database.
   * @param notificationId - The ID of the notification to update
   * @param profileId - The ID of the user owning this notification
   */
  async markAsRead(notificationId: string, profileId: string) {
    await this.notificationRepository
      .createQueryBuilder()
      .where('profileId = :profileId', { profileId })
      .andWhere('id = :id', { id: notificationId })
      .update({ is_read: true })
      .execute();
  }

  async getNotifications(
    profileId: string,
    offset: number = 0,
    limit: number = 10,
  ) {
    const count = await this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profileId = :profileId', { profileId })
      .getCount();
    const data = await this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profileId = :profileId', { profileId })
      .orderBy('NotificationEntity.created_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getMany();

    return {
      data,
      offset,
      limit,
      count,
    };
  }

  async getSettings(profileId: string) {
    return this.notificationSettingsRepository
      .createQueryBuilder()
      .where('profileId = :profileId', { profileId })
      .getOneOrFail();
  }

  async updateSettings(profileId: string, payload: NotificationSettingsDto) {
    await this.notificationSettingsRepository
      .createQueryBuilder()
      .update()
      .set({ settings: payload })
      .where('profileId = :profileId', { profileId })
      .execute();
    return this.notificationSettingsRepository
      .createQueryBuilder()
      .where('profileId = :profileId', { profileId })
      .getOneOrFail();
  }

  getTotalUnread(profileId: string) {
    return this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profileId = :profileId', { profileId })
      .where('NotificationEntity.is_read = false')
      .getCount();
  }
}
