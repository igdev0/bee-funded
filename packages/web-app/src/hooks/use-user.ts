import {useQuery} from '@tanstack/react-query';
import {getUser} from '../api/auth.ts';

export const useUser = () => {
  return useQuery({queryKey: ["me"], queryFn: getUser, retry: false});
};