import { useAccount } from "wagmi"
import { JSX } from "react/jsx-runtime"
import IntrinsicAttributes = JSX.IntrinsicAttributes

interface Options {
  fallback?: JSX.Element | null
}

export default function withConnected<T extends IntrinsicAttributes>(
  Component: () => JSX.Element,
  options?: Options,
) {
  return function WithConnected(props: T) {
    const account = useAccount()
    if (!account.isConnected) {
      return options?.fallback ?? null
    }
    return <Component {...props} />
  }
}
