import {
  AfterInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import NotificationEntity from '../../notification/entities/notification.entity';
import { DonationPoolEntity } from '../../donation-pool/entities/donation-pool.entity';
import NotificationSettingsEntity from '../../notification/entities/notification-settings.entity';

/**
 * Profile entity representing additional user information.
 */
@Entity('profile')
export default class ProfileEntity {
  /**
   * Unique identifier for the profile.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * One-to-one relationship with the user entity.
   */
  @OneToOne(() => UserEntity, (user) => user.profile)
  user: UserEntity;

  /**
   * Unique username for the profile.
   */
  @Column({
    type: 'text',
    nullable: true,
    unique: true,
  })
  username: string;
  /**
   * Unique email for the profile
   */
  @Column({
    type: 'text',
    unique: true,
    nullable: true,
  })
  email: string | null = null;

  /**
   * This will be set to true once the user verifies the email
   */
  @Column('boolean', { default: false })
  email_verified?: boolean = false;
  /**
   * Display name shown on the profile.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  display_name: string | null = null;

  /**
   * Biography or description of the user.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  bio?: string | null = null;

  /**
   * URL or path to the avatar image.
   */
  @Column({
    type: 'text',
  })
  avatar: string;

  /**
   * URL or path to the cover image.
   */
  @Column({
    type: 'text',
  })
  cover: string;

  @OneToOne(() => NotificationEntity, (notification) => notification.id)
  notification_settings: NotificationEntity;

  @OneToMany(() => DonationPoolEntity, (poolEntity) => poolEntity.profile)
  donation_pools: DonationPoolEntity[];
  /**
   * List of social media links associated with the profile.
   */
  @Column({
    type: 'json',
  })
  social_links: string[] = [];
  /**
   * Profiles that follow this profile.
   */
  @ManyToMany(() => ProfileEntity, (profile) => profile.following)
  @JoinTable()
  followers: ProfileEntity[];

  /**
   * Profile notifications
   */
  @OneToMany(() => NotificationEntity, (notification) => notification.profile)
  notifications: NotificationEntity[];
  /**
   * Profiles this profile is following.
   */
  @ManyToMany(() => ProfileEntity, (profile) => profile.followers, {})
  following: ProfileEntity[];
  /**
   * Timestamp when the profile was created.
   */
  @CreateDateColumn()
  created_at: Date;
  /**
   * Timestamp when the profile was last updated.
   */
  @UpdateDateColumn()
  updated_at: Date;
}
