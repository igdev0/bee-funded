import {http} from 'wagmi';
import {mainnet, sepolia} from 'wagmi/chains';
import {getDefaultConfig} from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: "Beefunded",
  projectId: "BEE_FUNDED",
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
