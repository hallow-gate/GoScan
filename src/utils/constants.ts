export const API_ENDPOINTS = {
  GOOGLE_SAFE_BROWSING: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
  PHISHTANK: 'https://checkurl.phishtank.com/checkurl/',
  URLSCAN: 'https://urlscan.io/api/v1/scan/',
  OPENWEATHERMAP: 'https://api.openweathermap.org/data/3.0/onecall',
  WHOIS: 'https://api.whois.vu/',
};

export const SCAM_PATTERNS = {
  BANKING: [
    'account suspended',
    'verify your account',
    'update your details',
    'login attempt',
    'unusual activity',
  ],
  GAMBLING: [
    'casino',
    'free spins',
    'jackpot winner',
    'claim your prize',
    'lucky draw',
  ],
  INVESTMENT: [
    'guaranteed returns',
    'double your money',
    'crypto investment',
    'forex trading',
    'passive income',
  ],
  PHISHING: [
    'click here',
    'urgent action',
    'limited time',
    'exclusive offer',
    'act now',
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
];

export const COLORS = {
  dark: {
    background: '#0a0e21',
    surface: '#1a1a2e',
    text: '#ffffff',
    subtext: '#a0a0b0',
    cardBg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
  },
  light: {
    background: '#f0f2f5',
    surface: '#ffffff',
    text: '#1a1a2e',
    subtext: '#666666',
    cardBg: 'rgba(255,255,255,0.9)',
    border: 'rgba(0,0,0,0.1)',
  },
};
