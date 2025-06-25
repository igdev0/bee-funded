import {ConnectButton} from '@rainbow-me/rainbowkit';

export default function WalletConnectButton() {
  return (
      <ConnectButton chainStatus="none" accountStatus="full" showBalance={true} label="Connect Wallet" />
  )
}