import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
