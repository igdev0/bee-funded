import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

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
    unique: true,
  })
  username: string;

  /**
   * Display name shown on the profile.
   */
  @Column({
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
  bio: string | null;

  /**
   * URL or path to the avatar image.
   */
  @Column()
  avatar: string;

  /**
   * URL or path to the cover image.
   */
  @Column()
  cover: string;

  /**
   * List of social media links associated with the profile.
   */
  @Column({
    type: 'array',
  })
  social_links: string[];
  /**
   * Profiles that follow this profile.
   */
  @ManyToMany(() => ProfileEntity, (profile) => profile.following, {})
  @JoinTable()
  followers: ProfileEntity[];

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
