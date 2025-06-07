import axios from '../axios.ts';

export const getUser = async () => {
  const {data} = await axios.get<any>("/auth/me");
  return data;
};