import { RootState, useAppDispatch } from "@core/store"
import {
  AccessTokenPayload,
  API_URL,
  useRefreshTokenQuery,
} from "@core/services/auth.ts"
import { useEffect, useRef } from "react"
import { clearTTL, setCredentials } from "@core/store/auth-slice.ts"
import { useSelector } from "react-redux"

const ACCESS_TOKEN_REFRESH_THRESHOLD = 60 * 2 // seconds
export default function useRefreshAuth() {
  const appDispatch = useAppDispatch()
  const accessTokenTTL = useSelector(
    (state: RootState) => state.authSlice.accessTokenTTL,
  )
  const refreshResult = useRefreshTokenQuery([])
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (accessTokenTTL) {
      timer.current = setTimeout(
        () => {
          appDispatch(clearTTL())
          refreshResult.refetch()
          clearTimeout(timer.current as keyof object)
        },
        (accessTokenTTL - ACCESS_TOKEN_REFRESH_THRESHOLD) * 1000,
      )
    }
  }, [accessTokenTTL])

  useEffect(() => {
    ;(async () => {
      if (refreshResult.data) {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${refreshResult.data.accessToken}`,
          },
        })

        const user: AccessTokenPayload = await res.json()
        appDispatch(
          setCredentials({
            accessToken: refreshResult.data.accessToken,
            accessTokenTTL: refreshResult.data.ttl,
            user,
          }),
        )
      }
    })()
  }, [refreshResult])

  return refreshResult
}
