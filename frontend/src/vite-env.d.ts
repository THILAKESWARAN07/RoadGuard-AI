/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_ENVIRONMENT: string
  readonly VITE_ENABLE_WEBSOCKETS: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_DEFAULT_LATITUDE: string
  readonly VITE_DEFAULT_LONGITUDE: string
  readonly VITE_MAP_DEFAULT_ZOOM: string
  readonly VITE_DATA_REFRESH_INTERVAL_MS: string
  readonly VITE_ENABLE_AUDIO_ALERTS: string
  readonly VITE_ENABLE_SPEECH_ALERTS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
