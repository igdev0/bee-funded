import useAppStore from '../stores/app.ts';
import {
  getNonce,
  getUser,
  signIn as signInAPI,
  signOut as signOutAPI,
  signUp as signUpAPI,
  userExists
} from '../api/auth.ts';
import {SignUpInput} from '../api/types.ts';
import {SiweMessage} from 'siwe';
import {useAccount, useSignMessage} from 'wagmi';
import {useEffect} from 'react';
import {useNavigate} from 'react-router';

export default function useAuth() {
  const appStore = useAppStore();
  const account = useAccount();
  const navigate = useNavigate();
  const {signMessageAsync} = useSignMessage();

  const signIn = async () => {
    const nonce = await getNonce();

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
    const {accessToken} = await signInAPI({nonce, signature, address: account.address as string, message});

    const user = await getUser();
    appStore.updateAccessToken(accessToken);
    appStore.updateUser(user);
  };

  const signUp = async (props: Omit<SignUpInput, "signature" | "message" | "nonce" | "address">) => {
    const nonce = await getNonce();

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
    const {accessToken} = await signUpAPI({message, nonce, signature, address: account.address as string, ...props});

    appStore.updateAccessToken(accessToken);
    const user = await getUser();
    appStore.updateUser(user);
  };

  const onDisconnect = async () => {
    await signOutAPI();
    appStore.updateAccessToken(null);
    appStore.updateUser(null);
  };

  useEffect(() => {
    if (account.isDisconnected && appStore.accessToken) {
      onDisconnect().then(console.log);
    }
  }, [account.isDisconnected, appStore.accessToken]);

  useEffect(() => {
    if(account.isConnected) {
      userExists(account.address as string).then(exists => {
        if(exists) {
          signIn().then(console.log);
        } else {
          navigate("/sign-up")
        }
      });
    }
  }, [account.isConnected, account.address])


  return {signIn, signUp, onDisconnect};
}