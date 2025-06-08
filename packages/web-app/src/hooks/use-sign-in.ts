import {useMutation} from '@tanstack/react-query';
import {signIn} from '../api/auth.ts';

export default function useSignIn() {
  return useMutation({
    mutationKey: ["useSignIn"],
    mutationFn: signIn,
    retry: false,
  })
}