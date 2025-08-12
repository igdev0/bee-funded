export type NotificationType = 'system' | 'on_chain' | 'custom';
export interface NotificationI {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'on_chain' | 'custom';
  is_read: boolean;
  metadata: object;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationTypes {
  new_follower: boolean;
  donationPoolCreation: boolean;
  followersPoolCreation: boolean;
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
