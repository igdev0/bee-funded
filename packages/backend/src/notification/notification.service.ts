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
   * @param profile_id - The user's profile ID
   */
  disconnectUser(profile_id: string) {
    const stream = this.userStreams.get(profile_id);
    if (stream) {
      stream.complete();
      this.userStreams.delete(profile_id);
    }
  }

  /**
   * Saves a new notification in the database and pushes it to the user's SSE stream if connected.
   * @param profile_id - The user profile to send the notification to
   * @param data - The notification payload (excluding id, created_at, updated_at)
   */
  async saveAndSend(
    profile_id: string,
    data: Omit<NotificationI, 'id' | 'created_at' | 'updated_at' | 'is_read'>,
  ) {
    const stream = this.userStreams.get(profile_id);
    const entity = this.notificationRepository.create({
      ...data,
      is_read: false,
      actor: data.actor,
      profile: { id: profile_id },
    });

    const saved = await this.notificationRepository.save(entity);
    // Send the notification over SSE if the user is connected
    if (stream) {
      stream.next(
        new MessageEvent(data.type, {
          data: {
            ...saved,
            title: saved.title.replace(
              '{display_name}',
              data.actor.display_name as string,
            ),
            message: saved.message.replace(
              '{display_name}',
              data.actor.display_name as string,
            ),
          },
        }),
      );
    }
  }

  /**
   * Marks a notification as read in the database.
   * @param notificationId - The ID of the notification to update
   * @param profile_id - The ID of the user owning this notification
   */
  async markAsRead(notificationId: string, profile_id: string) {
    await this.notificationRepository
      .createQueryBuilder()
      .where('profile_id = :profile_id', { profile_id })
      .andWhere('id = :id', { id: notificationId })
      .update({ is_read: true })
      .execute();
  }

  async getNotifications(
    profile_id: string,
    offset: number = 0,
    limit: number = 10,
  ) {
    const count = await this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profile_id = :profile_id', { profile_id })
      .getCount();
    const data = await this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profile_id = :profile_id', { profile_id })
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

  async getSettings(profile_id: string) {
    return this.notificationSettingsRepository
      .createQueryBuilder()
      .where('profile_id = :profile_id', { profile_id })
      .getOneOrFail();
  }

  async updateSettings(profile_id: string, payload: NotificationSettingsDto) {
    await this.notificationSettingsRepository
      .createQueryBuilder()
      .update()
      .set({ settings: payload })
      .where('profile_id = :profile_id', { profile_id })
      .execute();
    return this.notificationSettingsRepository
      .createQueryBuilder()
      .where('profile_id = :profile_id', { profile_id })
      .getOneOrFail();
  }

  getTotalUnread(profile_id: string) {
    return this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profile_id = :profile_id', { profile_id })
      .where('NotificationEntity.is_read = false')
      .getCount();
  }
}
