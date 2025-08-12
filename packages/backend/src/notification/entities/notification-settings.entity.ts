import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import ProfileEntity from '../../profile/entities/profile.entity';
import { NotificationSettings } from '../notification.interface';

const defaultNotificationSettings: NotificationSettings = {
  channels: {
    email: {
      enabled: true,
      notifications: {
        new_follower: true,
        followers_pool_creation: true,
        donation_pool_creation: true,
      },
    },
    in_app: {
      enabled: true,
      notifications: {
        new_follower: true,
        followers_pool_creation: true,
        donation_pool_creation: true,
      },
    },
  },
};

@Entity('notification-settings')
export default class NotificationSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => ProfileEntity, (profile) => profile.id)
  profile: ProfileEntity;
  /**
   *  The user selected settings applied
   */
  @Column('jsonb', { default: defaultNotificationSettings })
  settings: NotificationSettings;
}
