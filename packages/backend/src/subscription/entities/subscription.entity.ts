import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DonationPoolEntity } from '../../donation-pool/entities/donation-pool.entity';

@Entity('subscription')
export default class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 42 }) // Ethereum address
  subscriber: string;

  @Column({ type: 'varchar', length: 42 }) // ERC20 token address
  token: string;

  @Column({ type: 'bigint' })
  amount: string;

  @Column({ type: 'int', unsigned: true })
  interval: number;

  @Column({ type: 'int', unsigned: true })
  remaining_payments: number;

  @Column({ type: 'int', unsigned: true })
  deadline: number;

  @Column({ type: 'int', unsigned: true })
  next_payment_time: number;

  @Column({ type: 'int', unsigned: true })
  pool_id: number;

  @Column({ type: 'int', unsigned: true })
  on_chain_subscription_id: number;

  @ManyToOne(() => DonationPoolEntity, (entity) => entity.subscriptions, {
    onDelete: 'CASCADE',
  })
  pool: DonationPoolEntity;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: string;
}
