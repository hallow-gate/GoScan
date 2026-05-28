import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { threatDatabase } from './threatDatabase';

interface URLScanResult {
  url: string;
  isThreat: boolean;
  riskScore: number;
  threatType: string;
  indicators: string[];
  recommendation: string;
  expandedURL?: string;
  domainInfo?: {
    registrar: string;
    creationDate: string;
    suspiciousAge: boolean;
  };
}

class URLScanner {
  private phishingKeywords = [
    'login', 'verify', 'account', 'secure', 'banking', 'update',
    'confirm', 'password', 'credential', 'signin', 'unlock',
    'limited', 'suspended', 'urgent', 'immediate', 'wallet',
    'casino', 'lottery', 'prize', 'winner', 'claim', 'bonus',
    'crypto', 'bitcoin', 'investment', 'profit', 'double'
  ];

  private suspiciousTLDs = [
    '.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.work',
    '.date', '.racing', '.loan', '.win', '.download'
  ];

  private trustedDomains = [
    'google.com', 'facebook.com', 'apple.com', 'microsoft.com',
    'amazon.com', 'paypal.com', 'github.com', 'linkedin.com'
  ];

  async scanURL(url: string): Promise<URLScanResult> {
    try {
      // Normalize URL
      let normalizedURL = url.toLowerCase().trim();
      if (!normalizedURL.startsWith('http')) {
        normalizedURL = 'https://' + normalizedURL;
      }

      // Check against local threat database
      const localThreat = await this.checkLocalDatabase(normalizedURL);
      if (localThreat) return localThreat;

      // Expand shortened URLs
      if (this.isShortenedURL(normalizedURL)) {
        normalizedURL = await this.expandURL(normalizedURL);
      }

      // Multiple scanning engines
      const results = await Promise.all([
        this.heuristicAnalysis(normalizedURL),
        this.checkGoogleSafeBrowsing(normalizedURL),
        this.checkPhishTank(normalizedURL),
        this.checkURLScanIO(normalizedURL),
        this.domainAnalysis(normalizedURL)
      ]);

      // Aggregate results
      const finalResult = this.aggregateResults(normalizedURL, results);
      
      // Store result in local database
      await this.storeScanResult(normalizedURL, finalResult);

      return finalResult;
    } catch (error) {
      console.error('URL scan error:', error);
      return this.getDefaultResult(url);
    }
  }

  private async heuristicAnalysis(url: string): Promise<any> {
    const urlObj = new URL(url);
    const indicators: string[] = [];
    let score = 0;

    // Check for IP address instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
      score += 30;
      indicators.push('IP address used instead of domain');
    }

    // Check suspicious TLDs
    if (this.suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
      score += 20;
      indicators.push('Suspicious top-level domain');
    }

    // Check for excessive subdomains
    const subdomains = urlObj.hostname.split('.').length - 2;
    if (subdomains > 2) {
      score += 15;
      indicators.push('Excessive subdomains');
    }

    // Check URL length
    if (url.length > 100) {
      score += 10;
      indicators.push('Unusually long URL');
    }

    // Check for @ symbol
    if (url.includes('@')) {
      score += 25;
      indicators.push('URL contains @ symbol');
    }

    // Check for multiple hyphens
    if ((urlObj.hostname.match(/-/g) || []).length > 2) {
      score += 10;
      indicators.push('Multiple hyphens in domain');
    }

    // Check phishing keywords
    this.phishingKeywords.forEach(keyword => {
      if (url.includes(keyword)) {
        score += 15;
        indicators.push(`Contains phishing keyword: ${keyword}`);
      }
    });

    // Check for brand impersonation
    const brands = ['paypal', 'apple', 'google', 'microsoft', 'amazon', 'facebook', 'netflix'];
    brands.forEach(brand => {
      if (urlObj.hostname.includes(brand) && !urlObj.hostname.endsWith(`${brand}.com`)) {
        score += 40;
        indicators.push(`Potential ${brand} impersonation`);
      }
    });

    return { score: Math.min(score, 100), indicators };
  }

  private async checkGoogleSafeBrowsing(url: string): Promise<any> {
    try {
      // Using Google Safe Browsing API (free tier)
      const API_KEY = 'YOUR_GOOGLE_SAFE_BROWSING_API_KEY';
      const response = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`,
        {
          client: { clientId: 'shieldnet', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANDROID'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        }
      );

      if (response.data.matches) {
        return { score: 90, indicators: ['Flagged by Google Safe Browsing'] };
      }
      return { score: 0, indicators: [] };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private async checkPhishTank(url: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://checkurl.phishtank.com/checkurl/',
        new URLSearchParams({ url, format: 'json' })
      );

      if (response.data.results.in_database) {
        return { 
          score: 80, 
          indicators: ['Found in PhishTank database'] 
        };
      }
      return { score: 0, indicators: [] };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private async checkURLScanIO(url: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://urlscan.io/api/v1/scan/',
        { url, visibility: 'public' },
        { headers: { 'API-Key': 'YOUR_URLSCAN_API_KEY' } }
      );

      if (response.data.verdicts?.overall?.malicious) {
        return { 
          score: 70, 
          indicators: ['URLScan.io detected malicious content'] 
        };
      }
      return { score: 0, indicators: [] };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private async domainAnalysis(url: string): Promise<any> {
    try {
      const urlObj = new URL(url);
      const whoisResponse = await axios.get(
        `https://api.whois.vu/?q=${urlObj.hostname}`
      );

      const indicators: string[] = [];
      let score = 0;

      if (whoisResponse.data) {
        const creationDate = new Date(whoisResponse.data.creation_date);
        const daysOld = (Date.now() - creationDate.getTime()) / (1000 * 3600 * 24);

        if (daysOld < 30) {
          score += 40;
          indicators.push('Domain registered less than 30 days ago');
        }

        if (whoisResponse.data.privacy) {
          score += 10;
          indicators.push('Domain uses privacy protection');
        }
      }

      return { score, indicators };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private async checkLocalDatabase(url: string): Promise<URLScanResult | null> {
    const stored = await AsyncStorage.getItem('threat_database');
    if (stored) {
      const threats = JSON.parse(stored);
      const match = threats.find((t: any) => 
        url.includes(t.domain) || t.domain.includes(url)
      );
      
      if (match) {
        return {
          url,
          isThreat: true,
          riskScore: match.riskScore,
          threatType: match.threatType,
          indicators: match.indicators,
          recommendation: 'Previously detected threat. Avoid this URL.'
        };
      }
    }
    return null;
  }

  private async storeScanResult(url: string, result: URLScanResult) {
    const stored = await AsyncStorage.getItem('scan_history');
    const history = stored ? JSON.parse(stored) : [];
    
    history.unshift({
      ...result,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });

    // Keep last 100 scans
    await AsyncStorage.setItem('scan_history', JSON.stringify(history.slice(0, 100)));
  }

  private isShortenedURL(url: string): boolean {
    const shorteners = [
      'bit.ly', 'goo.gl', 't.co', 'tinyurl.com', 'ow.ly',
      'is.gd', 'buff.ly', 'adf.ly', 'shorte.st'
    ];
    return shorteners.some(s => url.includes(s));
  }

  private async expandURL(shortURL: string): Promise<string> {
    try {
      const response = await axios.get(shortURL, { maxRedirects: 0 });
      if (response.headers.location) {
        return response.headers.location;
      }
      return shortURL;
    } catch (error: any) {
      if (error.response?.headers?.location) {
        return error.response.headers.location;
      }
      return shortURL;
    }
  }

  private aggregateResults(url: string, results: any[]): URLScanResult {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const allIndicators = results.flatMap(r => r.indicators);
    const averageScore = Math.min(totalScore / results.length, 100);

    return {
      url,
      isThreat: averageScore > 50,
      riskScore: Math.round(averageScore),
      threatType: this.determineThreatType(allIndicators),
      indicators: [...new Set(allIndicators)],
      recommendation: this.generateRecommendation(averageScore),
    };
  }

  private determineThreatType(indicators: string[]): string {
    const types = {
      'Phishing': /phishing|credential|login|password|verify/i,
      'Malware': /malware|download|install|apk/i,
      'Scam': /scam|fraud|lottery|prize|winner|crypto/i,
      'Impersonation': /impersonat|fake|spoof/i,
      'Gambling': /casino|betting|gambling|poker|slot/i
    };

    for (const [type, pattern] of Object.entries(types)) {
      if (indicators.some(i => pattern.test(i))) return type;
    }
    return 'Suspicious';
  }

  private generateRecommendation(score: number): string {
    if (score > 75) return 'High risk! Do not visit this URL. Report to authorities.';
    if (score > 50) return 'Suspicious URL. Exercise extreme caution.';
    if (score > 25) return 'Some suspicious indicators found. Be careful.';
    return 'URL appears safe. Always verify security before entering information.';
  }

  private getDefaultResult(url: string): URLScanResult {
    return {
      url,
      isThreat: false,
      riskScore: 0,
      threatType: 'Unknown',
      indicators: [],
      recommendation: 'Unable to scan URL. Exercise caution.'
    };
  }
}

export const urlScanner = new URLScanner();
