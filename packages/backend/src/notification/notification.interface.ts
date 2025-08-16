import ProfileEntity from '../profile/entities/profile.entity';
import { NotificationMailContext } from '../mail/mail.service';

export type NotificationType = 'donation_pool_created';

export interface NotificationI {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actor: ProfileEntity;
  is_read: boolean;
  metadata: object;
  created_at: Date;
  updated_at: Date;
}

export type SaveNotificationI = Omit<
  NotificationI,
  'id' | 'created_at' | 'updated_at' | 'is_read'
>;

export type MailMessageI = Omit<NotificationMailContext, 'name'>;

export interface NotificationTypes {
  new_follower: boolean;
  donationPoolCreation: boolean;
  followingPoolCreation: boolean;
}

export interface NotificationChannel {
  enabled: boolean;
  notifications: NotificationTypes;
}

export interface NotificationSettingsChannels {
  email: NotificationChannel;
  inApp: NotificationChannel;
}

export interface NotificationSettings {
  channels: NotificationSettingsChannels;
}
