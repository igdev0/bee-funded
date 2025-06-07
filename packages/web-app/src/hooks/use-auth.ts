import {useQuery} from '@tanstack/react-query';
import {getUser} from '../api/auth.ts';

export const useAuth = () => {
  return useQuery({queryKey: ["me"], queryFn: getUser, retry: false});
};