import '@rainbow-me/rainbowkit/styles.css';
import {RouterProvider} from 'react-router';
import {use} from "react"
import router from './router.tsx';
import appLoader from './app-loader.ts';


function App() {
  const appStore = use(appLoader);

  // useEffect(() => {
  //   if (address) {
  //     setAddress(address);
  //   }
  // }, [setAddress, address]);

  // useEffect(() => {
  //   if(!userCheckLoading && isConnected && !userExists) {
  //     redirect("/sign-up");
  //     console.log("Should redirect to sign-up")
  //   }
  // }, [isConnected, userExists, userCheckLoading]);

  // useEffect(() => {
  //   if (address && chainId && nonce) {
  //     const message = new SiweMessage({
  //       domain: window.location.host,
  //       address,
  //       statement: 'Sign in with Ethereum. By signing this message you agree with terms and conditions',
  //       uri: window.location.origin,
  //       version: '1',
  //       chainId,
  //       nonce
  //     });
  //
  //     // sign.signMessageAsync({message: message.prepareMessage()}).then(console.log).catch(console.error);
  //   }
  // }, [address, nonce, isConnected, chainId]);

  return (
      <>
        <RouterProvider router={router}/>
      </>
  );
}

export default App;
