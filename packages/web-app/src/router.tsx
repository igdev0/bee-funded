import {createBrowserRouter} from 'react-router';
import LandingScreen from './screens/landing';
import SignUpScreen from './screens/sign-up';

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