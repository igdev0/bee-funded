import {useAccount} from 'wagmi';
import {useLoaderData} from 'react-router';
import {UserEntity} from '@/api/types.ts';

export default function useIsCurrentUser() {
  const account = useAccount();
  const {user} = useLoaderData<{user: UserEntity}>();
  return account.address ?  user.address === account.address : false;
}