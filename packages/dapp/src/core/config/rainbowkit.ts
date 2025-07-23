import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit"
import { createSiweMessage } from "viem/siwe"
import { appDispatch } from "@core/store"
import { clearCredentials, setCredentials } from "@core/store/auth-slice.ts"
import { AccessTokenPayload } from "@core/services/auth.ts"

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL

if (!BACKEND_URL) {
  throw new Error("VITE_BACKEND_API_URL should be set")
}
const authenticationAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    const response = await fetch(`${BACKEND_URL}/auth/nonce`, { mode: "cors" })
    return await response.text()
  },
  createMessage: ({ nonce, address, chainId }) => {
    return createSiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
    })
  },
  verify: async ({ message, signature }) => {
    const verifyRes = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, signature }),
    })
    const data: {
      accessToken: string
      accessTokenTTL: number
      user: AccessTokenPayload
    } = await verifyRes.json()

    appDispatch(setCredentials(data))
    return Boolean(verifyRes.ok)
  },
  signOut: async () => {
    await fetch(`${BACKEND_URL}/auth/signout`, {
      method: "POST",
      credentials: "include",
    })
    appDispatch(clearCredentials())
  },
})

export default authenticationAdapter
