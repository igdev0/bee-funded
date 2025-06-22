import {createBrowserRouter} from 'react-router';
import LandingScreen from './screens/landing';
import SignUpScreen from './screens/sign-up';
import SetupInitialPoolScreen from '@/screens/setup-initial-pool';
import PlatformScreen from '@/screens/platform';

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
  }
]);

export default router;