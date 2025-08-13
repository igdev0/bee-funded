import ProfileEntity from '../profile/entities/profile.entity';

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
