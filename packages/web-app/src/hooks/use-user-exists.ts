import {useQuery} from '@tanstack/react-query';
import {userExists} from '../api/auth.ts';
import {useState} from 'react';

export default function useUserExists() {
  const [address, setAddress] = useState<string>("");
  const queryProps = useQuery({
    queryKey: ["useUserExists", address],
    queryFn: ({queryKey}) => {
      return userExists(queryKey[1]);
    },
    retry: false,
    enabled: false,
  });

  return {...queryProps, setAddress};
}