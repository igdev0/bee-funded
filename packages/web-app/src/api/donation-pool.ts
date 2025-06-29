import {defaultClient} from '@/api/client.ts';
import {DonationPoolEntity, UpdateDonationPoolPayload} from '@/api/types.ts';

export const createDonationPoolApi = (client = defaultClient) => ({
  async updateDonationPool({id, ...payload}: UpdateDonationPoolPayload) {
    const {data} = await client.patch(`/donation-pool/${id}`, payload);
    return data;
  },

  async initDonationPool(user: string, title = "", description = "", main = true, max_amount = 0) {
    const {data} = await client.post<DonationPoolEntity>("/donation-pool", {
      user,
      title,
      description,
      main,
      max_amount
    });
    return data.id;
  },

  async findMainPoolChainId(userId: string) {
    const {data} = await client.get<number>(`/donation-pool/main/${userId}`);
    return data;
  },

  async findPoolsForUser(userId: string) {
    const {data} = await client.get<DonationPoolEntity[]>(`/donation-pool/user/${userId}`);
    return data;
  }
});


export default createDonationPoolApi();