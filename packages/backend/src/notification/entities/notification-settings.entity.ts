import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import ProfileEntity from '../../profile/entities/profile.entity';
import { NotificationSettings } from '../notification.interface';

const defaultNotificationSettings: NotificationSettings = {
  channels: {
    email: {
      enabled: true,
      notifications: {
        new_follower: true,
        followersPoolCreation: true,
        donationPoolCreation: true,
      },
    },
    inApp: {
      enabled: true,
      notifications: {
        new_follower: true,
        followersPoolCreation: true,
        donationPoolCreation: true,
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
