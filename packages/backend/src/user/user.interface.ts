import { NotificationI } from '../notification/notification.interface';
import ProfileEntity from '../profile/entities/profile.entity';

export interface UserI {
  id: string;
  profile: ProfileEntity;
  wallet_address: string;
  notifications: NotificationI[];
  created_at: Date;
  updated_at: Date;
}
