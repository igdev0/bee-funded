import {ConnectButton} from '@rainbow-me/rainbowkit';

export default function Navbar() {
  return (
      <div className="container mx-auto flex justify-between py-2 items-center">
        <h1 className="text-2xl font-bold">🐝 BeeFunded</h1>
        <ConnectButton/>
      </div>
  )
}