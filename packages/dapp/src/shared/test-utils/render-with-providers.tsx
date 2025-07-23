import store from "@core/store"
import { WagmiProvider } from "wagmi"
import wagmi from "@core/config/wagmi.ts"
import { QueryClientProvider } from "@tanstack/react-query"
import queryProvider from "@core/config/tanstackQuery.ts"
import { Provider } from "react-redux"
import { ReactElement } from "react"

export default function renderWithProviders(Element: ReactElement) {
  return (
    <Provider store={store}>
      <WagmiProvider config={wagmi}>
        <QueryClientProvider client={queryProvider}>
          {Element}
        </QueryClientProvider>
      </WagmiProvider>
    </Provider>
  )
}
