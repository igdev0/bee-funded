import {useMutation} from '@tanstack/react-query';
import {signUp} from '../api/auth.ts';

export default function useSignUp() {
  return useMutation({
    mutationKey: ["useSignUp"],
    mutationFn: signUp,
    retry: false,
  })
}