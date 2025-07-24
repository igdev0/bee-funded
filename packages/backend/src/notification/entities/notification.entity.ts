import {
  Column,
  CreateDateColumn,
  Entity,
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

  @ManyToOne(() => ProfileEntity, (profile) => profile.notifications, {
    onDelete: 'CASCADE',
  })
  profile: ProfileEntity;

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
