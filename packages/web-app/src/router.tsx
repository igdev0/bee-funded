import {createBrowserRouter} from 'react-router';
import LandingScreen from './screens/landing';
import SignUpScreen from './screens/sign-up';
import SetupInitialPoolScreen from '@/screens/setup-initial-pool';
import PlatformScreen from '@/screens/platform';
import userApi from '@/api/user.ts';
import donationPool from '@/api/donation-pool.ts';

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
      const user = await userApi.getUserByUsername(args.params.username as string);
      const mainPoolChainId = user ? await donationPool.findMainPoolChainId(user.id) : 0;
      return {
        user,
        mainPoolChainId
      };
    }
  }
]);

export default router;