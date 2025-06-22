import {defaultClient} from '@/api/client.ts';
import {DonationPoolEntity, UpdateDonationPoolPayload} from '@/api/types.ts';

export const createDonationPoolApi = (client = defaultClient) => ({
  async updateDonationPool({id, ...payload}: UpdateDonationPoolPayload) {
    const {data} = await client.patch(`/donation-pool/${id}`, payload);
    return data;
  },

  async initDonationPool(user: string) {
    const {data} = await client.post<DonationPoolEntity>("/donation-pool", {
      user,
      title: "",
      description: "",
      main: true,
    });
    return data.id;
  },
});


export default createDonationPoolApi();