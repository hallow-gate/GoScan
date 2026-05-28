// server.js - Backend API for ShieldNet Secure
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// Middleware
// ============================================
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'ShieldNet Secure API',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// URL Scanning Endpoint
// ============================================
app.post('/api/scan-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Perform heuristic analysis (always works without API keys)
    const result = await performHeuristicAnalysis(url);

    // Try Google Safe Browsing if API key is available
    if (process.env.GOOGLE_SAFE_BROWSING_API_KEY && 
        process.env.GOOGLE_SAFE_BROWSING_API_KEY !== 'your_google_safe_browsing_api_key_here') {
      try {
        const safeBrowsingResult = await checkGoogleSafeBrowsing(url);
        if (safeBrowsingResult) {
          result.riskScore = Math.max(result.riskScore, safeBrowsingResult.score);
          result.indicators.push(...safeBrowsingResult.indicators);
          result.scanSources.push('Google Safe Browsing');
        }
      } catch (error) {
        console.error('Safe Browsing check failed:', error.message);
      }
    }

    // Determine final result
    result.isThreat = result.riskScore >= 50;
    result.threatType = determineThreatType(result.indicators);
    result.recommendation = generateRecommendation(result.riskScore);

    res.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed', message: error.message });
  }
});

// ============================================
// Threat Reporting Endpoint
// ============================================
app.post('/api/report-threat', (req, res) => {
  try {
    const { type, severity, url, domain, content, phoneNumber } = req.body;

    // Validate required fields
    if (!type || !severity) {
      return res.status(400).json({ error: 'Type and severity are required' });
    }

    // In production, save to database (Supabase, etc.)
    const report = {
      id: Date.now().toString(36),
      type,
      severity,
      url,
      domain,
      content,
      phoneNumber,
      timestamp: new Date().toISOString(),
      status: 'received'
    };

    console.log('Threat reported:', report);

    res.json({
      success: true,
      message: 'Threat reported successfully',
      reportId: report.id
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to report threat' });
  }
});

// ============================================
// Domain Check Endpoint
// ============================================
app.post('/api/check-domain', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const result = {
      domain,
      isSuspicious: false,
      age: null,
      registrar: null,
      riskScore: 0,
      indicators: []
    };

    // Check domain age using free WHOIS API
    try {
      const whoisResponse = await axios.get(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.whois.com/whois/${domain}`)}`,
        { timeout: 5000 }
      );

      const data = whoisResponse.data;
      if (data.includes('Creation Date')) {
        const creationMatch = data.match(/Creation Date: (.+)/);
        if (creationMatch) {
          const creationDate = new Date(creationMatch[1]);
          const daysOld = (Date.now() - creationDate.getTime()) / (1000 * 3600 * 24);
          result.age = Math.round(daysOld);
          
          if (daysOld < 30) {
            result.isSuspicious = true;
            result.riskScore += 40;
            result.indicators.push('Domain registered less than 30 days ago');
          }
        }
      }
    } catch (whoisError) {
      console.error('WHOIS lookup failed:', whoisError.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Domain check error:', error);
    res.status(500).json({ error: 'Domain check failed' });
  }
});

// ============================================
// Weather Endpoint (Proxy)
// ============================================
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!process.env.OPENWEATHERMAP_API_KEY || 
        process.env.OPENWEATHERMAP_API_KEY === 'your_openweathermap_api_key_here') {
      return res.status(503).json({ error: 'Weather service not configured' });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall`,
      {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHERMAP_API_KEY,
          units: 'metric'
        },
        timeout: 5000
      }
    );

    const data = response.data;
    res.json({
      temperature: Math.round(data.current.temp),
      condition: data.current.weather[0].main,
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_speed * 3.6),
      uvIndex: Math.round(data.current.uvi),
      rainChance: (data.hourly[0].pop || 0) * 100,
      hourly: data.hourly.slice(0, 8).map(hour => ({
        time: new Date(hour.dt * 1000).getHours() + ':00',
        temp: Math.round(hour.temp),
        condition: hour.weather[0].main
      }))
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

// ============================================
// Security Tips Endpoint
// ============================================
app.get('/api/security-tips', (req, res) => {
  const tips = [
    { id: 1, tip: 'Never share your OTP or passwords with anyone', category: 'general' },
    { id: 2, tip: 'Banks will never ask for credentials via SMS or email', category: 'banking' },
    { id: 3, tip: 'Always verify URLs before clicking on links', category: 'general' },
    { id: 4, tip: 'Use strong, unique passwords for each account', category: 'security' },
    { id: 5, tip: 'Enable two-factor authentication when available', category: 'security' },
    { id: 6, tip: 'Keep your apps and operating system updated', category: 'security' },
    { id: 7, tip: 'Avoid using public WiFi for sensitive transactions', category: 'privacy' },
    { id: 8, tip: 'Regularly monitor your bank statements', category: 'banking' },
    { id: 9, tip: 'Be cautious of unsolicited messages and calls', category: 'general' },
    { id: 10, tip: 'Report suspicious messages to authorities', category: 'general' }
  ];
  
  res.json({ tips, total: tips.length });
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Helper Functions
// ============================================
async function performHeuristicAnalysis(url) {
  const indicators = [];
  let score = 0;
  const scanSources = ['Heuristic Analysis'];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.work', '.date'];
    const matchedTLD = suspiciousTLDs.find(tld => hostname.endsWith(tld));
    if (matchedTLD) {
      score += 25;
      indicators.push(`Suspicious TLD: ${matchedTLD}`);
    }

    // IP address as domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      score += 30;
      indicators.push('IP address used instead of domain');
    }

    // Phishing keywords
    const phishingKeywords = ['login', 'verify', 'account', 'secure', 'banking', 'update', 
      'confirm', 'password', 'credential', 'signin', 'casino', 'lottery', 'prize', 'winner'];
    const foundKeywords = phishingKeywords.filter(keyword => url.includes(keyword));
    if (foundKeywords.length > 0) {
      score += foundKeywords.length * 10;
      indicators.push(`Suspicious keywords: ${foundKeywords.slice(0, 3).join(', ')}`);
    }

    // HTTPS check
    if (!url.startsWith('https://')) {
      score += 5;
      indicators.push('Not using HTTPS');
    }

  } catch (error) {
    indicators.push('URL parsing failed');
    score += 50;
  }

  return {
    url,
    riskScore: Math.min(score, 100),
    indicators,
    scanSources,
    isThreat: false,
    threatType: 'Unknown',
    recommendation: ''
  };
}

async function checkGoogleSafeBrowsing(url) {
  try {
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
      {
        client: { clientId: 'shieldnet-secure', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANDROID'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      },
      { timeout: 5000 }
    );

    if (response.data?.matches) {
      return { score: 90, indicators: ['Flagged by Google Safe Browsing'] };
    }
    return { score: 0, indicators: [] };
  } catch (error) {
    return null;
  }
}

function determineThreatType(indicators) {
  const indicatorString = indicators.join(' ').toLowerCase();
  if (/phishing|credential|login|password|verify|account/i.test(indicatorString)) return 'Phishing';
  if (/malware|trojan|virus|ransomware/i.test(indicatorString)) return 'Malware';
  if (/scam|fraud|fake|lottery|prize|winner/i.test(indicatorString)) return 'Scam';
  if (/casino|gambling|bet|poker/i.test(indicatorString)) return 'Gambling';
  return 'Suspicious';
}

function generateRecommendation(score) {
  if (score >= 90) return 'CRITICAL: Do not visit this URL. Report to authorities.';
  if (score >= 75) return 'HIGH RISK: Strong indicators of malicious activity.';
  if (score >= 50) return 'SUSPICIOUS: Exercise extreme caution.';
  if (score >= 25) return 'CAUTION: Some warning signs detected.';
  return 'URL appears safe. Always practice safe browsing.';
}

// ============================================
// Start Server
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ShieldNet Secure API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
