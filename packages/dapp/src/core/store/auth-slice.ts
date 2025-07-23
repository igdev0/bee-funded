import { createSlice } from "@reduxjs/toolkit"
import { AccessTokenPayload } from "@core/services/auth.ts"

interface AuthState {
  accessToken: string | null
  user: AccessTokenPayload | null
  accessTokenTTL: number | null
}

const slice = createSlice({
  name: "auth",
  reducers: {
    setCredentials(
      state,
      action: {
        payload: {
          user: AccessTokenPayload
          accessToken: string
          accessTokenTTL: number
        }
      },
    ) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.accessTokenTTL = action.payload.accessTokenTTL
    },

    clearTTL(state) {
      state.accessTokenTTL = null
    },

    clearCredentials(state) {
      state.accessToken = null
      state.user = null
      state.accessTokenTTL = null
    },
  },
  initialState: {
    user: null,
    accessToken: null,
  } as AuthState,
})

export const { setCredentials, clearCredentials, clearTTL } = slice.actions

export default slice.reducer
