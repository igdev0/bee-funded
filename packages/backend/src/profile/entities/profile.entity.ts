import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('profile')
export default class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, (user) => user.profile)
  user: UserEntity;

  @Column({
    unique: true,
  })
  username: string;

  @Column()
  display_name: string;

  @Column({
    type: 'text',
  })
  bio: string;

  @Column({
    type: 'array',
  })
  social_links: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
