import '@rainbow-me/rainbowkit/styles.css';
import {RouterProvider} from 'react-router';
import {use, useEffect} from "react";
import router from './router.tsx';
import appLoader from './app-loader.ts';

function App() {
  use(appLoader);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/notifications", {
      withCredentials: true,
    });

    eventSource.addEventListener("message", (event) => {
      console.log(event.data);
    });
    // @ts-ignore
    return () => eventSource.close();
  }, []);

  return (
      <>
        <RouterProvider router={router}/>
      </>
  );
}

export default App;
