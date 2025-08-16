import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  FollowerMailMessage,
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
import { MailService, NotificationMailContext } from '../mail/mail.service';

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

  /**
   * Prepares a notification entity for display by replacing placeholders
   * in the title and message with actual actor data.
   *
   * @param data – The notification entity containing title, message, and actor information.
   * @returns A new object with the `title` and `message` fields updated, where
   *          any `{display_name}` placeholders are replaced with the actor's display name.
   *
   * @remarks
   * This method currently replaces only the `{display_name}` token.
   * Additional placeholders can be added if needed in the future.
   */
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

  /**
   * Creates and persists a new in-app notification for a specific profile.
   *
   * @param profile_id – The ID of the profile to which the notification belongs.
   * @param data – The notification content and metadata to be saved.
   * @returns The saved notification entity.
   *
   * @remarks
   * The notification is always initialized as unread (`is_read: false`)
   * when created.
   */
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

  /**
   * Retrieves the notification settings for a given profile.
   *
   * @param profile_id – The ID of the profile whose notification settings should be fetched.
   * @returns The notification settings entity associated with the given profile.
   * @throws NotFoundError if no settings are found for the provided profile_id.
   */
  async getSettings(profile_id: string) {
    return this.notificationSettingsRepository
      .createQueryBuilder()
      .where('profile_id = :profile_id', { profile_id })
      .getOneOrFail();
  }

  /**
   * Updates the notification settings for a given profile.
   *
   * @param profile_id – The ID of the profile whose settings should be updated.
   * @param payload – The new notification settings to persist.
   * @returns The updated notification settings entity.
   * @throws NotFoundError if no settings are found for the provided profile_id.
   */
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

  /**
   * Counts the total number of unread notifications for a given profile.
   *
   * @param profile_id – The ID of the profile whose unread notifications should be counted.
   * @returns The total count of unread notifications.
   */
  getTotalUnread(profile_id: string) {
    return this.notificationRepository
      .createQueryBuilder()
      .where('NotificationEntity.profile_id = :profile_id', { profile_id })
      .where('NotificationEntity.is_read = false')
      .getCount();
  }

  /**
   * Retrieves followers of a profile who have a specific notification preference enabled.
   *
   * For each notification channel (e.g., email, in-app), it filters the followers
   * based on their personal notification settings.
   *
   * @param profileId – The ID of the profile whose followers should be checked.
   * @param preference – The notification type/key to filter followers for (e.g., "donation_pool_created").
   * @returns A Map where each key is a notification channel, and the value is an array of
   *          ProfileEntity objects representing followers who have that preference enabled.
   *
   * @example
   *   const followersMap = await getFollowersForPreference("123", "donation_pool_created");
   *   // followersMap.get("email") -> followers who want email notifications for this type
   *   // followersMap.get("inApp") -> followers who want in-app notifications for this type
   */
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

  /**
   * Sends notifications to the actor (the profile performing an action) through
   * enabled channels based on their personal notification settings.
   *
   * This method handles two channels:
   * 1. In-app notifications
   * 2. Email notifications
   *
   * @param actorProfile – The profile entity of the actor to notify.
   * @param inAppMessage – The in-app notification content to be saved and sent.
   * @param mailMessage – The email notification content to be sent via MailService.
   *
   * @remarks
   * The method first checks the actor's notification settings for each channel.
   * Only if the channel is enabled and the specific notification type
   * (`donationPoolCreation`) is allowed will it send the notification.
   */
  async processActorNotifications(
    actorProfile: ProfileEntity,
    inAppMessage: SaveNotificationI,
    mailMessage: NotificationMailContext,
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

  /**
   * Sends notifications to all followers/subscribers of the actor profile
   * who have enabled the specific notification preference.
   *
   * This method handles two channels:
   * 1. In-app notifications
   * 2. Email notifications
   *
   * @param actorProfile – The profile entity of the actor who triggered the notification.
   * @param inAppMessage – The in-app notification content to be saved and sent to followers.
   * @param mailMessage – The email notification content to be sent to followers via MailService.
   *
   * @remarks
   * The method first retrieves the list of followers who have enabled the
   * 'donationPoolCreation' notification preference for each channel.
   * Then, it sends notifications only to those followers on their enabled channels.
   */
  async processFollowersNotifications(
    actorProfile: ProfileEntity,
    inAppMessage: SaveNotificationI,
    mailMessage: FollowerMailMessage,
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
