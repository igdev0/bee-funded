import "./app.css"
import { createBrowserRouter, RouterProvider } from "react-router"
import { useSelector } from "react-redux"
import { RootState } from "@core/store"
import {
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit"
import authentication from "@core/config/rainbowkit.ts"
import { ThemeProvider } from "@shared/components/theme-provider"
import useRefreshAuth from "@shared/hooks/use-refresh-auth.ts"
import SwapperScreen from "@features/swapper/screens/swapper.tsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: <SwapperScreen />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

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
          <App />
        </ThemeProvider>
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  )
}

export default Root
