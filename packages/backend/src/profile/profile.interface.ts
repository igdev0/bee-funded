import { UserI } from '../user/user.interface';

export interface ProfileI {
  id: string;
  user: UserI | null;
  username: string;
  display_name: string;
  bio: string;
  created_at: Date;
  updated_at: Date;
}
