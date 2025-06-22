import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export const DonationPoolStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  ERRORED: 'ERRORED',
} as const;

export type DonationPoolStatus =
  (typeof DonationPoolStatus)[keyof typeof DonationPoolStatus];

@Entity()
export class DonationPool {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => User, (user) => user.pools)
  user: string;

  @Column({
    unique: true,
    nullable: true,
  })
  on_chain_pool_id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  tx_hash: string;

  @Column({
    default: false,
  })
  main: boolean;

  @Column({ default: 0 })
  max_amount?: number;

  @Column({ nullable: true })
  max_amount_token: string;

  @Column({
    enum: [
      DonationPoolStatus.CREATED,
      DonationPoolStatus.PENDING,
      DonationPoolStatus.PUBLISHED,
      DonationPoolStatus.ERRORED,
    ],
    nullable: true,
  })
  status: DonationPoolStatus;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
