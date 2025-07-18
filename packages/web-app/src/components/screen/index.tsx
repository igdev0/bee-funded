import {PropsWithChildren} from 'react';
import Navbar from '../navbar';
import useAuth, {useInitAuth} from '../../hooks/use-auth.ts';
import useAppStore from '@/stores/app.ts';

interface ScreenProps {
  className?: string;
  wrapperClassName?: string;
  requiresAuth?: boolean;
  authenticatedRedirectTo?: string;
  requiresAuthRedirectTo?: string;
}

export default function Screen(props: PropsWithChildren<ScreenProps>) {
  useAuth();
  useInitAuth();
  const {initialized, user} = useAppStore();
  if (!initialized) {
    return null;
  }

  if (props.requiresAuth && !user) {
    window.location.replace(props.requiresAuthRedirectTo ?? "/");
    return null;
  }

  if (props.authenticatedRedirectTo && user) {
    window.location.replace(props.authenticatedRedirectTo);
    return null;
  }

  return (
      <div className={`w-full h-full absolute left-0 top-0 overflow-auto ${props.wrapperClassName}`}>
        <Navbar/>
        <div className={`container mx-auto ${props.className}`}>
          {props.children}
        </div>
      </div>
  );
}