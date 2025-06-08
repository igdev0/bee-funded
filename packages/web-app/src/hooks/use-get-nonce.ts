import {useQuery} from '@tanstack/react-query';
import {getNonce} from '../api/auth.ts';

export default function useGetNonce() {
  return useQuery({
    queryKey: ["nonce"],
    queryFn: getNonce,
    retry: false,
  })
}