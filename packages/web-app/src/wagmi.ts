import {mainnet, sepolia} from 'wagmi/chains';
import {getDefaultConfig} from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: "BeeFunded",
  projectId: "e27dfcb068ff336529af4a9620b95eea",
  chains: [mainnet, sepolia],
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
