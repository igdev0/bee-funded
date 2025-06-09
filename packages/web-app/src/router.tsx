import {createBrowserRouter} from 'react-router';
import LandingScreen from './screens/landing.tsx';
import SignUpScreen from './screens/sign-up.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingScreen/>,
  },
  {
    path: "/sign-up",
    element: <SignUpScreen/>,
  }
]);

export default router;