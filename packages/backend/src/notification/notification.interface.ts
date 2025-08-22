import ProfileEntity from '../profile/entities/profile.entity';

export type NotificationType = 'donation_pool_created' | 'donation_processed';

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

export type ProcessInAppMessage = Omit<SaveNotificationI, 'actor'>;

export interface ProcessMailMessage {
  message: string;
  actionPath: string;
}

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
