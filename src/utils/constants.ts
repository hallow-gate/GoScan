import env from './env';

export const API_ENDPOINTS = {
  GOOGLE_SAFE_BROWSING: env.APIs.GOOGLE_SAFE_BROWSING,
  PHISHTANK: env.APIs.PHISHTANK,
  URLSCAN: env.APIs.URLSCAN,
  OPENWEATHERMAP: env.APIs.OPENWEATHERMAP,
  WHOIS: env.APIs.WHOIS,
  VIRUSTOTAL: env.APIs.VIRUSTOTAL,
  ABUSEIPDB: env.APIs.ABUSEIPDB,
};

export const SCAM_PATTERNS = {
  BANKING: [
    'account suspended',
    'verify your account',
    'update your details',
    'login attempt',
    'unusual activity',
    'security breach',
    'unauthorized access',
    'confirm identity',
  ],
  GAMBLING: [
    'casino',
    'free spins',
    'jackpot winner',
    'claim your prize',
    'lucky draw',
    'online betting',
    'sports betting',
    'no deposit bonus',
  ],
  INVESTMENT: [
    'guaranteed returns',
    'double your money',
    'crypto investment',
    'forex trading',
    'passive income',
    'work from home',
    'earn money fast',
    'financial freedom',
  ],
  PHISHING: [
    'click here',
    'urgent action',
    'limited time',
    'exclusive offer',
    'act now',
    'verify now',
    'update required',
    'account locked',
  ],
  TECH_SUPPORT: [
    'technical support',
    'computer virus',
    'system alert',
    'windows support',
    'remote access',
    'teamviewer',
    'anydesk',
  ],
};

export const SECURITY_TIPS = [
  'Never share your OTP or passwords with anyone',
  'Banks will never ask for your credentials via SMS',
  'Always verify URLs before clicking on them',
  'Use strong, unique passwords for each account',
  'Enable two-factor authentication when possible',
  'Keep your apps and system updated',
  'Avoid using public WiFi for sensitive transactions',
  'Regularly monitor your bank statements',
  'Be cautious of unsolicited messages and calls',
  'Report suspicious messages to authorities',
  'Use a password manager for complex passwords',
  'Check for HTTPS before entering sensitive data',
  'Be wary of too-good-to-be-true offers',
  'Never install apps from unknown sources',
  'Regularly backup your important data',
];

export const COLORS = {
  dark: {
    background: '#0a0e21',
    surface: '#1a1a2e',
    text: '#ffffff',
    subtext: '#a0a0b0',
    cardBg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: '#e94560',
    gradient: ['#1a1a2e', '#16213e', '#0f3460'],
  },
  light: {
    background: '#f0f2f5',
    surface: '#ffffff',
    text: '#1a1a2e',
    subtext: '#666666',
    cardBg: 'rgba(255,255,255,0.9)',
    border: 'rgba(0,0,0,0.1)',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: '#3b82f6',
    gradient: ['#e0e7ff', '#f0f4ff', '#ffffff'],
  },
};

// App configuration from environment
export const APP_CONFIG = {
  NAME: env.APP_NAME || 'ShieldNet Secure',
  VERSION: env.APP_VERSION || '1.0.0',
  ENV: env.APP_ENV || 'development',
  DEBUG: env.APP_DEBUG,
  TIMEOUT: env.API_TIMEOUT,
  CACHE_TIMEOUT: env.CACHE_TIMEOUT,
  MAX_SCAN_HISTORY: env.MAX_SCAN_HISTORY,
  SIMILARITY_THRESHOLD: env.SIMILARITY_THRESHOLD,
};

// Feature flags from environment
export const FEATURES = {
  WEATHER: env.ENABLE_WEATHER,
  BIOMETRIC: env.ENABLE_BIOMETRIC,
  CLIPBOARD_SCAN: env.ENABLE_CLIPBOARD_SCAN,
  BACKGROUND_MONITORING: env.ENABLE_BACKGROUND_MONITORING,
  AUTO_SCAN: env.ENABLE_AUTO_SCAN,
  REPORTING: env.ENABLE_REPORTING,
  ANIMATIONS: env.ENABLE_ANIMATIONS,
};
