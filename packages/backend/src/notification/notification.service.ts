import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  MailMessageI,
  NotificationI,
  NotificationSettingsChannels,
  NotificationTypes,
  SaveNotificationI,
} from './notification.interface';
import { InjectRepository } from '@nestjs/typeorm';
import NotificationEntity from './entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationSettingsDto } from './dto/notification-settings.dto';
import NotificationSettingsEntity from './entities/notification-settings.entity';
import { ProfileService } from '../profile/profile.service';
import ProfileEntity from '../profile/entities/profile.entity';
import { MailService, NotificationContext } from '../mail/mail.service';

@Injectable()
export class NotificationService {
  // A map to hold active SSE streams per connected user
  private userStreams = new Map<string, Subject<MessageEvent<NotificationI>>>();

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationSettingsEntity)
    private readonly notificationSettingsRepository: Repository<NotificationSettingsEntity>,
    private readonly profileService: ProfileService,
    private readonly mailService: MailService,
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

  prepareData(data: NotificationEntity) {
    return {
      ...data,
      title: data.title.replace(
        '{display_name}',
        data.actor.display_name as string,
      ),
      message: data.message.replace(
        '{display_name}',
        data.actor.display_name as string,
      ),
    };
  }

  /**
   * Saves a new notification in the database and pushes it to the user's SSE stream if connected.
   * @param profile_id - The user profile to send the notification to
   * @param data - The notification payload (excluding id, created_at, updated_at)
   */
  send(profile_id: string, data: NotificationEntity) {
    const stream = this.userStreams.get(profile_id);
    // Send the notification over SSE if the user is connected
    if (stream) {
      stream.next(
        new MessageEvent(data.type, {
          data: this.prepareData(data),
        }),
      );
    }
  }

  save(profile_id: string, data: SaveNotificationI) {
    const entity = this.notificationRepository.create({
      ...data,
      is_read: false,
      profile: { id: profile_id },
    });

    return this.notificationRepository.save(entity);
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

  async getFollowersForPreference(
    profileId: string,
    preference: keyof NotificationTypes,
  ) {
    const followers = await this.profileService.getFollowers(profileId);
    const channels = [
      'email',
      'inApp',
    ] as (keyof NotificationSettingsChannels)[];

    const cache = new Map<
      keyof NotificationSettingsChannels,
      ProfileEntity[]
    >();

    for (const channel of channels) {
      const cachedFollowers: ProfileEntity[] = [];
      for (const follower of followers) {
        const { settings } = await this.getSettings(follower.id);
        if (
          settings.channels[channel].enabled &&
          settings.channels[channel].notifications[preference]
        ) {
          cachedFollowers.push(follower);
        }
        cache.set(channel, cachedFollowers);
      }
    }

    return cache;
  }

  async processActorNotifications(
    actorProfile: ProfileEntity,
    inAppMessage: SaveNotificationI,
    mailMessage: NotificationContext,
  ) {
    // 1. Notify the actor in app
    const { settings: actorNotificationSettings } = await this.getSettings(
      actorProfile.id,
    );
    if (
      actorNotificationSettings.channels.inApp.enabled &&
      actorNotificationSettings.channels.inApp.notifications
        .donationPoolCreation
    ) {
      const notification = await this.save(actorProfile.id, inAppMessage);
      this.send(actorProfile.id, notification);
    }

    // 2. Notify the actor by email
    if (
      actorNotificationSettings.channels.email.enabled &&
      actorNotificationSettings.channels.email.notifications
        .donationPoolCreation
    ) {
      await this.mailService.sendNotification(actorProfile.id, mailMessage);
    }
  }

  async processFollowersNotifications(
    actorProfile: ProfileEntity,
    inAppMessage: SaveNotificationI,
    mailMessage: MailMessageI,
  ) {
    // 2. Process notifications for subscribers
    const subscribers = await this.getFollowersForPreference(
      actorProfile.id,
      'donationPoolCreation',
    );

    for (const subscriber of subscribers.get('inApp') ?? []) {
      const notification = await this.save(subscriber.id, inAppMessage);
      this.send(subscriber.id, notification);
    }

    for (const subscriber of subscribers.get('email') ?? []) {
      await this.mailService.sendNotification(subscriber.id, {
        ...mailMessage,
        name: subscriber.display_name ?? '',
      });
    }
  }
}
