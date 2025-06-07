import {mainnet, sepolia} from 'wagmi/chains';
import {getDefaultConfig} from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: "Beefunded",
  projectId: "BEE_FUNDED",
  chains: [mainnet, sepolia],
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
