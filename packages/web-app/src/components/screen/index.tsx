import {PropsWithChildren} from 'react';
import Navbar from '../navbar';
import useAuth, {useInitAuth} from '../../hooks/use-auth.ts';
import useAppStore from '@/stores/app.ts';
import {useNavigate} from 'react-router';

interface ScreenProps {
  className?: string;
  requiresAuth?: boolean;
  authenticatedRedirectTo?: string;
  requiresAuthRedirectTo?: string;
}

export default function Screen(props: PropsWithChildren<ScreenProps>) {
  useAuth();
  useInitAuth();
  const {initialized, user} = useAppStore();
  const navigate = useNavigate()
  if(!initialized) {
    return null;
  }

  if(props.requiresAuth && !user) {
    navigate(props.requiresAuthRedirectTo ??"/");
    return null;
  }

  if(props.authenticatedRedirectTo && user) {
    navigate(props.authenticatedRedirectTo);
    return null;
  }

  return (
      <div className={`w-full h-full absolute left-0 top-0 overflow-auto ${props.className}`}>
        <Navbar/>
        <div className="container mx-auto">
          {props.children}
        </div>
      </div>
  );
}