import "./app.css"
import { createBrowserRouter, RouterProvider } from "react-router"
import CounterScreen from "@features/counter/screens"
import withConnectedNetworks from "@shared/hocs/with-supported-networks.tsx"
import { memo } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@core/store"
import {
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit"
import authentication from "@core/config/rainbowkit.ts"
import { ThemeProvider } from "@shared/components/theme-provider"
import useRefreshAuth from "@shared/hooks/use-refresh-auth.ts"

const router = createBrowserRouter([
  {
    path: "/",
    element: <CounterScreen />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

const WrappedApp = withConnectedNetworks(memo(App))

export function Root() {
  const auth = useSelector((state: RootState) => state.authSlice)
  const refreshResult = useRefreshAuth()
  return (
    <RainbowKitAuthenticationProvider
      adapter={authentication}
      status={
        refreshResult.isFetching
          ? "loading"
          : auth.accessToken
            ? "authenticated"
            : "unauthenticated"
      }
    >
      <RainbowKitProvider>
        <ThemeProvider>
          <WrappedApp />
        </ThemeProvider>
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  )
}

export default Root
