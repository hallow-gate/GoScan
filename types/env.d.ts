declare module '@env' {
  export const GOOGLE_SAFE_BROWSING_API_KEY: string;
  export const PHISHTANK_API_KEY: string;
  export const URLSCAN_API_KEY: string;
  export const OPENWEATHERMAP_API_KEY: string;
  export const VIRUSTOTAL_API_KEY: string;
  export const ABUSEIPDB_API_KEY: string;
  
  export const APP_NAME: string;
  export const APP_ENV: string;
  export const APP_DEBUG: string;
  export const APP_VERSION: string;
  
  export const API_URL: string;
  export const API_TIMEOUT: string;
  export const API_VERSION: string;
  
  export const DATABASE_NAME: string;
  export const DATABASE_VERSION: string;
  export const MAX_SCAN_HISTORY: string;
  export const MAX_THREAT_DATABASE: string;
  
  export const ENCRYPTION_KEY: string;
  export const JWT_SECRET: string;
  export const SESSION_TIMEOUT: string;
  
  export const SMS_MONITORING_ENABLED: string;
  export const SMS_SCAN_INTERVAL: string;
  export const SMS_MAX_MESSAGES: string;
  
  export const URL_SCAN_TIMEOUT: string;
  export const URL_EXPAND_TIMEOUT: string;
  export const MAX_REDIRECTS: string;
  export const SIMILARITY_THRESHOLD: string;
  
  export const NOTIFICATION_CHANNEL_ID: string;
  export const NOTIFICATION_CHANNEL_NAME: string;
  
  export const DEFAULT_THEME: string;
  export const THEME_STORAGE_KEY: string;
  export const ENABLE_ANIMATIONS: string;
  
  export const ENABLE_WEATHER: string;
  export const ENABLE_BIOMETRIC: string;
  export const ENABLE_CLIPBOARD_SCAN: string;
  export const ENABLE_BACKGROUND_MONITORING: string;
  export const ENABLE_AUTO_SCAN: string;
  export const ENABLE_REPORTING: string;
  
  export const CACHE_ENABLED: string;
  export const CACHE_TIMEOUT: string;
  export const WEATHER_CACHE_TIMEOUT: string;
  export const THREAT_CACHE_TIMEOUT: string;
  
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const SUPABASE_ENABLED: string;
  
  export const SENTRY_DSN: string;
  export const SENTRY_ENABLED: string;
  
  export const ADMOB_APP_ID: string;
  export const ADMOB_ENABLED: string;
  
  export const DEEP_LINK_SCHEME: string;
  export const DEEP_LINK_HOST: string;
}
