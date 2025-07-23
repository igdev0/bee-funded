import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import NotificationEntity from '../../notification/entities/notification.entity';
import ProfileEntity from '../../profile/entities/profile.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => ProfileEntity, (profile) => profile.user, {
    cascade: ['insert'],
  })
  @JoinColumn()
  profile: ProfileEntity;

  @Column({
    unique: true,
  })
  wallet_address?: string;

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
