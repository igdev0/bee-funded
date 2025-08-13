import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationType } from '../notification.interface';
import ProfileEntity from '../../profile/entities/profile.entity';

@Entity('notification')
export default class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => ProfileEntity, (profile) => profile.received_notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: ProfileEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.acted_notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actor_id' })
  actor: ProfileEntity;

  @Column({ type: 'text' })
  type: NotificationType;

  @Column({ type: 'boolean' })
  is_read: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: object;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
