import { JSX } from "react/jsx-runtime"
import { useSelector } from "react-redux"
import { RootState } from "@core/store"
import { ComponentType } from "react"

interface Options {
  fallback?: JSX.Element | null
}

export default function withAuthenticated<T extends Record<string, unknown>>(
  Component: ComponentType,
  options?: Options,
) {
  return function WithConnected(props: T) {
    const accessToken = useSelector(
      (state: RootState) => state.authSlice.accessToken,
    )
    if (!accessToken) {
      return options?.fallback ?? null
    }
    return <Component {...props} />
  }
}
