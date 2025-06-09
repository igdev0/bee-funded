import useAppStore from '../stores/app.ts';
import {SignUpPayload} from '../api/types.ts';
import {SiweMessage} from 'siwe';
import {useAccount, useSignMessage} from 'wagmi';
import {useEffect} from 'react';
import {useNavigate} from 'react-router';
import {createAuthApi} from '@/api/auth.ts';

export default function useAuth() {
  const api = createAuthApi();
  const appStore = useAppStore();
  const account = useAccount();
  const navigate = useNavigate();
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

  useEffect(() => {
    if(account.isConnected && !appStore.accessToken) {
      api.userExists(account.address as string).then(exists => {
        if(exists && !appStore.accessToken) {
          signIn().then(console.log);
        } else {
          navigate("/sign-up")
        }
      });
    }
  }, [account.isConnected, appStore.accessToken, account.address])


  return {signIn, signUp, onDisconnect};
}