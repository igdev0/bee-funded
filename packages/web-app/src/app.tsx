import '@rainbow-me/rainbowkit/styles.css';
import {RouterProvider} from 'react-router';
import {use} from "react";
import router from './router.tsx';
import appLoader from './app-loader.ts';

function App() {
  use(appLoader);

  return (
      <>
        <RouterProvider router={router}/>
      </>
  );
}

export default App;
