import './index.css';
import {Buffer} from 'buffer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import React, {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import {RainbowKitProvider} from '@rainbow-me/rainbowkit';
import {WagmiProvider} from 'wagmi';

import App from './app.tsx';
import {config} from './wagmi.ts';
import Spinner from './components/spinner';

globalThis.Buffer = Buffer;

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Suspense fallback={<Spinner/>}>
              <App/>
            </Suspense>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>,
);
