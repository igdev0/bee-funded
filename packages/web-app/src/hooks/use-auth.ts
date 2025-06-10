import useAppStore from '../stores/app.ts';
import {SignUpPayload} from '../api/types.ts';
import {SiweMessage} from 'siwe';
import {useAccount, useSignMessage} from 'wagmi';
import {useEffect} from 'react';
import {useNavigate} from 'react-router';
import {createAuthApi} from '@/api/auth.ts';

export function useInitAuth() {
  const api = createAuthApi();
  const account = useAccount();
  const appStore = useAppStore();
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (account.address && !appStore.accessToken) {
        const exists = await api.userExists(account.address as string);
        if (exists) {
          await auth.signIn();
        } else {
          navigate("/sign-up");
        }
      }
    })();
  }, [appStore.accessToken, account.address]);
}

export default function useAuth() {
  const api = createAuthApi();
  const appStore = useAppStore();
  const account = useAccount();
  const {signMessageAsync} = useSignMessage();

  const signIn = async () => {
    const nonce = await api.getNonce();
    if (appStore.accessToken) {
      return null;
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
    const {accessToken} = await api.signIn({nonce, signature, address: account.address as string, message});

    const user = await api.getUser();
    appStore.updateAccessToken(accessToken);
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
    const {accessToken} = await api.signUp({message, nonce, signature, address: account.address as string, ...props});

    appStore.updateAccessToken(accessToken);
    const user = await api.getUser();
    appStore.updateUser(user);
  };

  const onDisconnect = async () => {
    await api.signOut();
    appStore.updateAccessToken(null);
    appStore.updateUser(null);
  };

  useEffect(() => {
    if (account.isDisconnected && appStore.accessToken) {
      onDisconnect().then(console.log);
    }
  }, [account.isDisconnected, appStore.accessToken]);


  return {signIn, signUp, onDisconnect};
}