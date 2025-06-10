import {PropsWithChildren} from 'react';
import Navbar from '../navbar';
import useAuth, {useInitAuth} from '../../hooks/use-auth.ts';

export default function Screen(props: PropsWithChildren) {
  useAuth();
  useInitAuth();
  return (
      <div className="w-full h-full absolute left-0 top-0 overflow-auto">
        <Navbar/>
        <div className="container mx-auto">
          {props.children}
        </div>
      </div>
  );
}