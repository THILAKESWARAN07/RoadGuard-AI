export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  appName: import.meta.env.VITE_APP_NAME || 'RoadGuard AI',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  enableWebSockets: import.meta.env.VITE_ENABLE_WEBSOCKETS === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enablePWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  defaultLatitude: parseFloat(import.meta.env.VITE_DEFAULT_LATITUDE || '28.6139'),
  defaultLongitude: parseFloat(import.meta.env.VITE_DEFAULT_LONGITUDE || '77.2090'),
  mapDefaultZoom: parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '14', 10),
  dataRefreshIntervalMs: parseInt(import.meta.env.VITE_DATA_REFRESH_INTERVAL_MS || '20000', 10),
  enableAudioAlerts: import.meta.env.VITE_ENABLE_AUDIO_ALERTS === 'true',
  enableSpeechAlerts: import.meta.env.VITE_ENABLE_SPEECH_ALERTS === 'true',
} as const;

export type Config = typeof config;
