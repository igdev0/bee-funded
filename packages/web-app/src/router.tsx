import {createBrowserRouter} from 'react-router';
import LandingScreen from './screens/landing';
import SignUpScreen from './screens/sign-up';
import SetupInitialPoolScreen from '@/screens/setup-initial-pool';

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
    element: <SetupInitialPoolScreen/>
  }
]);

export default router;