/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAINBOW_KIT_PROJECT_ID: string
  readonly VITE_RAINBOW_KIT_APP_NAME: string
  readonly VITE_RAINBOW_KIT_APP_URL: string
  readonly VITE_BACKEND_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
