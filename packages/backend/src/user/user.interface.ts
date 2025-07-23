import { ProfileI } from '../profile/profile.interface';
import { NotificationI } from '../notification/notification.interface';

export interface UserI {
  id: string;
  profile: ProfileI | null;
  wallet_address: string;
  notifications: NotificationI[];
  created_at: Date;
  updated_at: Date;
}
