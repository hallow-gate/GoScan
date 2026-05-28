import {
  GOOGLE_SAFE_BROWSING_API_KEY,
  PHISHTANK_API_KEY,
  URLSCAN_API_KEY,
  OPENWEATHERMAP_API_KEY,
  VIRUSTOTAL_API_KEY,
  ABUSEIPDB_API_KEY,
  APP_ENV,
  APP_DEBUG,
  API_TIMEOUT,
  SMS_SCAN_INTERVAL,
  SIMILARITY_THRESHOLD,
  CACHE_TIMEOUT,
  WEATHER_CACHE_TIMEOUT,
  MAX_SCAN_HISTORY,
  ENABLE_WEATHER,
  ENABLE_CLIPBOARD_SCAN,
  ENABLE_BACKGROUND_MONITORING,
  ENABLE_AUTO_SCAN,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SENTRY_DSN,
  SENTRY_ENABLED,
} from '@env';

// Environment Configuration
export const env = {
  // API Keys
  GOOGLE_SAFE_BROWSING_API_KEY,
  PHISHTANK_API_KEY,
  URLSCAN_API_KEY,
  OPENWEATHERMAP_API_KEY,
  VIRUSTOTAL_API_KEY,
  ABUSEIPDB_API_KEY,
  
  // App Configuration
  APP_ENV: APP_ENV || 'development',
  APP_DEBUG: APP_DEBUG === 'true',
  API_TIMEOUT: parseInt(API_TIMEOUT || '10000', 10),
  
  // Scanner Configuration
  SMS_SCAN_INTERVAL: parseInt(SMS_SCAN_INTERVAL || '5000', 10),
  SIMILARITY_THRESHOLD: parseFloat(SIMILARITY_THRESHOLD || '0.6'),
  
  // Cache Configuration
  CACHE_TIMEOUT: parseInt(CACHE_TIMEOUT || '1800000', 10),
  WEATHER_CACHE_TIMEOUT: parseInt(WEATHER_CACHE_TIMEOUT || '1800000', 10),
  MAX_SCAN_HISTORY: parseInt(MAX_SCAN_HISTORY || '1000', 10),
  
  // Feature Flags
  ENABLE_WEATHER: ENABLE_WEATHER === 'true',
  ENABLE_CLIPBOARD_SCAN: ENABLE_CLIPBOARD_SCAN === 'true',
  ENABLE_BACKGROUND_MONITORING: ENABLE_BACKGROUND_MONITORING === 'true',
  ENABLE_AUTO_SCAN: ENABLE_AUTO_SCAN === 'true',
  
  // External Services
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SENTRY_DSN,
  SENTRY_ENABLED: SENTRY_ENABLED === 'true',
  
  // Helper Methods
  isDevelopment: () => APP_ENV === 'development',
  isProduction: () => APP_ENV === 'production',
  isDebug: () => APP_DEBUG === 'true',
  
  // API Base URLs
  APIs: {
    GOOGLE_SAFE_BROWSING: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
    PHISHTANK: 'https://checkurl.phishtank.com/checkurl/',
    URLSCAN: 'https://urlscan.io/api/v1/scan/',
    OPENWEATHERMAP: 'https://api.openweathermap.org/data/3.0/onecall',
    WHOIS: 'https://api.whois.vu/',
    VIRUSTOTAL: 'https://www.virustotal.com/vtapi/v2/url/report',
    ABUSEIPDB: 'https://api.abuseipdb.com/api/v2/check',
  },
};

export default env;
