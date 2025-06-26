import {ConnectButton} from '@rainbow-me/rainbowkit';

export default function WalletConnectButton() {
  return (
      <ConnectButton accountStatus="full" showBalance={true} label="Connect Wallet" />
  )
}