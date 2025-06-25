import useAppStore from '../stores/app.ts';
import {SignUpPayload} from '../api/types.ts';
import {SiweMessage} from 'siwe';
import {useAccount, useSignMessage} from 'wagmi';
import {useEffect} from 'react';
import {createAuthApi} from '@/api/auth.ts';
import {useNavigate} from 'react-router';

export function useInitAuth() {
  const api = createAuthApi();
  const address = useAccount().address;
  const user = useAppStore().user;
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (address && !user) {
        const exists = await api.userExists({address});
        if (exists) {
          await auth.signIn();
        } else {
          navigate("/sign-up");
        }
      }
    })();
  }, [user, address]);
}

export default function useAuth() {
  const api = createAuthApi();
  const appStore = useAppStore();
  const account = useAccount();
  const {signMessageAsync} = useSignMessage();

  const signIn = async () => {
    const nonce = await api.getNonce();
    const rawMessage = new SiweMessage({
      domain: window.location.host,
      address: account.address,
      statement: 'Sign in with Ethereum.',
      uri: window.location.origin,
      version: '1',
      chainId: account.chainId,
      nonce
    });
    const message = rawMessage.prepareMessage();

    const signature = await signMessageAsync({message});
    await api.signIn({nonce, signature, address: account.address as string, message});

    const user = await api.getUser();
    appStore.updateUser(user);
  };

  const signUp = async (props: Omit<SignUpPayload, "signature" | "message" | "nonce" | "address">) => {
    const nonce = await api.getNonce();

    const rawMessage = new SiweMessage({
      domain: window.location.host,
      address: account.address,
      statement: 'Sign in with Ethereum.',
      uri: window.location.origin,
      version: '1',
      chainId: account.chainId,
      nonce
    });

    const message = rawMessage.prepareMessage();

    const signature = await signMessageAsync({message});
    await api.signUp({message, nonce, signature, address: account.address as string, ...props});

    const user = await api.getUser();
    appStore.updateUser(user);
  };

  const onDisconnect = async () => {
    await api.signOut();
    appStore.updateUser(null);
  };

  useEffect(() => {
    if (account.isDisconnected && appStore.user) {
      onDisconnect().then(console.log);
    }
  }, [account.isDisconnected, appStore.user]);
  return {signIn, signUp, onDisconnect};
}