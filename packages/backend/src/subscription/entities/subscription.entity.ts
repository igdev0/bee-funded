import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DonationPoolEntity } from '../../donation-pool/entities/donation-pool.entity';

@Entity('subscription')
export default class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 42 }) // Ethereum address
  subscriber: string;

  @Column({ type: 'varchar', length: 42 }) // ERC20 token address
  token: string;

  @Column({ type: 'decimal', precision: 78, scale: 0 }) // BigNumber safe
  amount: string;

  @Column({ type: 'bigint' })
  nextPaymentTime: string; // unix timestamp

  @Column({ type: 'bigint' })
  interval: string; // seconds

  @Column({ type: 'int' })
  poolId: number;

  @ManyToOne(() => DonationPoolEntity, (entity) => entity.subscriptions, {
    onDelete: 'CASCADE',
  })
  pool: DonationPoolEntity;

  @Column({ type: 'smallint', unsigned: true })
  remainingDuration: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'bigint', nullable: true })
  expiredAt: string | null;
}
