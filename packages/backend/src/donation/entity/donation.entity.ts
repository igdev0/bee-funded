import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DonationPoolEntity } from '../../donation-pool/entities/donation-pool.entity';
import ProfileEntity from '../../profile/entities/profile.entity';

/**
 * DonationEntity represents an on-chain donation recorded in the database.
 */
@Entity('donation')
export default class DonationEntity {
  /**
   * Unique identifier for the donation (UUID).
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The pool this donation belongs to (many-to-one). Cascade delete: if a pool is deleted, its donations are removed.
   */
  @ManyToOne(() => DonationPoolEntity, (pool) => pool.donations, {
    onDelete: 'CASCADE',
  })
  pool: DonationPoolEntity;

  /**
   * A boolean indicating if the donation is a reoccurring type of donation.
   */
  @Column('boolean')
  is_recurring: boolean;
  /**
   * Blockchain address of the donor (always stored, even if no profile exists).
   */
  @Column('text')
  donor_address: string;

  /**
   * Blockchain transaction hash
   */
  @Column('text')
  tx_hash: string;

  /**
   * Optional relation to a Profile (if the donor has an account in the system). Cascade delete applies.
   */
  @ManyToOne(() => ProfileEntity, (profile) => profile.donations, {
    onDelete: 'CASCADE',
  })
  donor_profile?: ProfileEntity;

  /**
   * The token address (ERC-20 / native token wrapped) used for the donation.
   */
  @Column({
    type: 'text',
  })
  token: string;

  /**
   * The amount donated, stored as a string to handle big numbers safely.
   */
  @Column({ type: 'bigint' })
  amount: bigint;
  /**
   * Optional message left by the donor along with the donation.
   */
  @Column('text')
  message: string;

  /**
   * Timestamp when the donation was created (auto-managed by TypeORM).
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * Timestamp when the donation was last updated (auto-managed by TypeORM).
   */
  @UpdateDateColumn()
  updated_at: Date;
}
