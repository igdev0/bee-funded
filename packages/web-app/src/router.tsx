import {createBrowserRouter} from 'react-router';
import LandingScreen from './screens/landing';
import SignUpScreen from './screens/sign-up';
import SetupInitialPoolScreen from '@/screens/setup-initial-pool';
import PlatformScreen from '@/screens/platform';
import user from '@/api/user.ts';

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingScreen/>,
  },
  {
    path: "/sign-up",
    element: <SignUpScreen/>,
  },
  {
    path: "/onboarding/setup-initial-pool",
    element: <SetupInitialPoolScreen/>,
  },
  {
    path: `/platform/:username`,
    element: <PlatformScreen/>,
    async loader(args) {
      return user.getUserByUsername(args.params.username as string);
    }
  }
]);

export default router;