import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import ProfileEntity from '../../profile/entities/profile.entity';
import { DonationPoolKind, DonationPoolStatus } from '../types';
import { keccak256 } from 'ethers';

@Entity('donation-pool')
export class DonationPoolEntity {
  /**
   * Unique identifier for the donation pool.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * The keccak256 hash of the id
   */
  @Column({ type: 'text' })
  id_hash: string;
  /**
   * Optional on-chain ID associated with the donation pool, mapped from the smart contract.
   *
   * This will be updated once BeeFundedCore emits PoolCreated event
   */
  @Column('int', { nullable: true, default: null })
  on_chain_id!: number | null;
  /**
   * Chain ID of the blockchain network where the donation pool exists.
   *
   * This will be updated once BeeFundedCore emits PoolCreated event
   */
  @Column('int', { nullable: true, default: null })
  chain_id!: number | null;
  /**
   * Address of the wallet that owns or manages the donation pool.
   *
   */
  @Column('text', { nullable: true, default: null })
  owner_address!: string | null;
  /**
   * The token used to determine the valuation of donations (e.g. USDC, ETH).
   */
  @Column('text', { nullable: true, default: null })
  valuation_token: string;
  /**
   * Optional cap (maximum amount) for donations in this pool.
   *
   * This will be updated once BeeFundedCore emits PoolCreated event
   */

  @Column('int', { nullable: true, default: null })
  cap!: number | null;
  /**
   * The cover image displayed in the card of the donation pool.
   */
  @Column('text', { nullable: true, default: null })
  image!: string | null;
  /**
   * Optional title of the donation pool.
   *
   * This field will be only necessary if the kind is not 'main'.
   */
  @Column('text', { nullable: true, default: null })
  title!: string | null;
  /**
   * Optional description providing more details about the donation pool.
   *
   * This field will be only necessary if the kind is not 'main'.
   */
  @Column('text', { nullable: true, default: null })
  description!: string | null;
  /**
   * Type of the donation pool. Can be either 'main' or 'objective'.
   *
   */
  @Column('text')
  kind: DonationPoolKind;
  /**
   * The profile associated with this donation pool (inverse side of the relation).
   */
  @OneToMany(
    () => ProfileEntity,
    (profileEntity) => profileEntity.donation_pools,
  )
  @JoinColumn()
  profile: ProfileEntity;
  /**
   * List of tags used to categorize or filter donation pools (e.g., "education", "climate", "web3")
   */
  @Column('json', { default: [] })
  tags: string[];
  /**
   * The status of the donation pool
   */
  @Column('text', { default: 'draft' })
  status: DonationPoolStatus;
  /**
   * Timestamp of when the donation pool was created.
   */
  @CreateDateColumn()
  created_at!: Date;
  /**
   * Timestamp of the last update to the donation pool.
   */
  @UpdateDateColumn()
  updated_at!: Date;

  @BeforeInsert()
  generateIdHash() {
    this.id_hash = keccak256(this.id);
  }
}
