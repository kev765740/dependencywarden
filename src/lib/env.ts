// Environment fallback for development
export const env = {
  MODE: import.meta.env?.MODE || 'development',
  PROD: import.meta.env?.PROD || false,
  DEV: import.meta.env?.DEV || true,
  VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || '',
  VITE_SENTRY_DSN: import.meta.env?.VITE_SENTRY_DSN || '',
  VITE_APP_VERSION: import.meta.env?.VITE_APP_VERSION || '1.0.0'
};
