import {Link} from 'react-router';
import WalletConnectButton from '@/components/wallet-connect-button';

export default function Navbar() {
  return (
      <div className="container mx-auto flex justify-between py-2 items-center">
        <Link to="/" className="text-2xl font-bold">🐝 Funded</Link>
        <WalletConnectButton/>
      </div>
  );
}