import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { hardhat } from "wagmi/chains"
import { http } from "wagmi"

const config = getDefaultConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http(),
  },
  appName: import.meta.env.VITE_RAINBOW_KIT_APP_NAME,
  projectId: import.meta.env.VITE_RAINBOW_KIT_PROJECT_ID,
  appIcon: "/",
  appUrl: import.meta.env.VITE_RAINBOW_KIT_APP_URL,
})

export default config
