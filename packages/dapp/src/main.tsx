import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app.tsx"
import "./index.css"
import wagmi from "@core/config/wagmi.ts"
import queryProvider from "@core/config/tanstackQuery.ts"
import { QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import store from "@core/store"
import { Provider } from "react-redux"

const container = document.getElementById("root")
if (container) {
  const root = createRoot(container)

  root.render(
    <StrictMode>
      <Provider store={store}>
        <WagmiProvider config={wagmi}>
          <QueryClientProvider client={queryProvider}>
            <App />
          </QueryClientProvider>
        </WagmiProvider>
      </Provider>
    </StrictMode>,
  )
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  )
}
