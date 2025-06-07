import Navbar from './components/navbar';
import '@rainbow-me/rainbowkit/styles.css';
import {useEffect} from 'react';
import {useAccount} from 'wagmi';
import {SiweMessage} from 'siwe';

function App() {
  const {address, isConnected, chainId} = useAccount();
  useEffect(() => {
    if(address) {
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: Math.random().toString(36).substring(2),
      });
      // @ts-expect-error
      const prepared = message.prepareMessage();
      // @todo: Retrieve the nonce from the backend and send a sign in request.
    }
  }, [address, isConnected, chainId])

  return (
    <>
      <Navbar/>
    </>
  )
}

export default App
