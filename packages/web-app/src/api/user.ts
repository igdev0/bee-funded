import {defaultClient} from '@/api/client.ts';
import {UserEntity} from '@/api/types.ts';

export const createUserApi = (client = defaultClient) => ({
  async getUserByUsername(username: string) {
    const {data} = await client.get<UserEntity>(`/user/${username}`);
    return data;
  }
});

export default createUserApi();