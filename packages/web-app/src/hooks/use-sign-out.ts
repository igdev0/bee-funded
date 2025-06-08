import {useMutation} from '@tanstack/react-query';
import {signOut} from '../api/auth.ts';

export default function useSignOut() {
  return useMutation({
    mutationKey: ["useSignOut"],
    mutationFn: signOut,
    retry: false,
  })
}