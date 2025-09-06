import { defineConfig } from "@wagmi/cli"
import { hardhat as hardhatChain } from "wagmi/chains"
import { hardhat, react } from "@wagmi/cli/plugins"

export default defineConfig({
  out: "src/shared/hooks/generated.ts",
  contracts: [],
  plugins: [
    hardhat({
      project: "../contracts",
      deployments: {
        Counter: {
          [hardhatChain.id]: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        },
      },
    }),
    react(),
  ],
})
