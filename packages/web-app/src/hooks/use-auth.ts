import useAppStore from '../stores/app.ts';
import {SignUpPayload} from '../api/types.ts';
import {SiweMessage} from 'siwe';
import {useAccount, useSignMessage} from 'wagmi';
import {useCallback, useEffect} from 'react';
import {createAuthApi} from '@/api/auth.ts';
import {useNavigate} from 'react-router';

export function useInitAuth() {
  const api = createAuthApi();
  const account = useAccount();
  const user = useAppStore().user;
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (account.address && !user) {
        const exists = await api.userExists({address: account.address});
        if (exists) {
          await auth.signIn(account);
        } else {
          navigate("/sign-up");
        }
      }
    })();
  }, [user, account.address]);
}

export default function useAuth() {
  const api = createAuthApi();
  const appStore = useAppStore();
  const currentAccount = useAccount();
  const {signMessageAsync} = useSignMessage();

  const signIn = useCallback(async (account = currentAccount ) => {
    const nonce = await api.getNonce();
    if(!account.address) {
      throw new Error('Account not found.');
    }
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
  }, [currentAccount]);

  const signUp = async (props: Omit<SignUpPayload, "signature" | "message" | "nonce" | "address">) => {
    const nonce = await api.getNonce();
    if(!currentAccount.address) {
      throw new Error('Account not found.');
    }
    const rawMessage = new SiweMessage({
      domain: window.location.host,
      address: currentAccount.address,
      statement: 'Sign in with Ethereum.',
      uri: window.location.origin,
      version: '1',
      chainId: currentAccount.chainId,
      nonce
    });

    const message = rawMessage.prepareMessage();

    const signature = await signMessageAsync({message});
    await api.signUp({message, nonce, signature, address: currentAccount.address as string, ...props});

    const user = await api.getUser();
    appStore.updateUser(user);
  };

  const onDisconnect = async () => {
    await api.signOut();
    appStore.updateUser(null);
  };

  useEffect(() => {
    if (currentAccount.isDisconnected && appStore.user) {
      onDisconnect().then(console.log);
    }
  }, [currentAccount.isDisconnected, appStore.user]);
  return {signIn, signUp, onDisconnect};
}