import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DonationPool } from '../../donation-pool/entities/donation-pool.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({
    nullable: false,
    unique: true,
  })
  address: string;

  @OneToMany(() => DonationPool, (pool) => pool.user)
  pools: DonationPool[];

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  display_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  banner_url?: string;

  @Column({ type: 'boolean', nullable: true, default: null })
  is_creator?: boolean;

  @Column({ type: 'json', nullable: true, default: [] })
  categories?: string[];

  @Column({
    default: false,
  })
  complete?: boolean;

  @Column({ type: 'boolean', default: false })
  accepted_terms: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
