import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription')
export default class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: string;
}
