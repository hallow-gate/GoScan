import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../utils/env';

interface URLScanResult {
  url: string;
  isThreat: boolean;
  riskScore: number;
  threatType: string;
  indicators: string[];
  recommendation: string;
  expandedURL?: string;
  domainInfo?: {
    registrar?: string;
    creationDate?: string;
    suspiciousAge?: boolean;
  };
}

class URLScanner {
  private phishingKeywords = [
    'login', 'verify', 'account', 'secure', 'banking', 'update',
    'confirm', 'password', 'credential', 'signin', 'unlock',
    'limited', 'suspended', 'urgent', 'immediate', 'wallet',
    'casino', 'lottery', 'prize', 'winner', 'claim', 'bonus',
    'crypto', 'bitcoin', 'investment', 'profit', 'double',
    'free', 'offer', 'discount', 'exclusive', 'congratulations'
  ];

  private suspiciousTLDs = [
    '.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.work',
    '.date', '.racing', '.loan', '.win', '.download', '.review',
    '.country', '.stream', '.gdn', '.xin', '.men', '.bid'
  ];

  private trustedDomains = [
    'google.com', 'facebook.com', 'apple.com', 'microsoft.com',
    'amazon.com', 'paypal.com', 'github.com', 'linkedin.com',
    'twitter.com', 'instagram.com', 'youtube.com', 'netflix.com'
  ];

  async scanURL(url: string): Promise<URLScanResult> {
    try {
      let normalizedURL = url.toLowerCase().trim();
      
      if (!normalizedURL.startsWith('http://') && !normalizedURL.startsWith('https://')) {
        normalizedURL = 'https://' + normalizedURL;
      }

      // Check local database first
      const localResult = await this.checkLocalDatabase(normalizedURL);
      if (localResult) return localResult;

      // Expand shortened URLs
      if (this.isShortenedURL(normalizedURL)) {
        try {
          const expanded = await this.expandURL(normalizedURL);
          if (expanded && expanded !== normalizedURL) {
            normalizedURL = expanded;
          }
        } catch (error) {
          if (env.APP_DEBUG) console.warn('Could not expand URL:', error);
        }
      }

      // Run multiple checks based on available API keys
      const checks: Promise<any>[] = [
        this.heuristicAnalysis(normalizedURL),
      ];

      if (env.GOOGLE_SAFE_BROWSING_API_KEY && env.GOOGLE_SAFE_BROWSING_API_KEY !== 'your_google_safe_browsing_api_key_here') {
        checks.push(this.checkGoogleSafeBrowsing(normalizedURL));
      }

      if (env.PHISHTANK_API_KEY && env.PHISHTANK_API_KEY !== 'your_phishtank_api_key_here') {
        checks.push(this.checkPhishTank(normalizedURL));
      }

      if (env.URLSCAN_API_KEY && env.URLSCAN_API_KEY !== 'your_urlscan_api_key_here') {
        checks.push(this.checkURLScanIO(normalizedURL));
      }

      if (env.VIRUSTOTAL_API_KEY && env.VIRUSTOTAL_API_KEY !== 'your_virustotal_api_key_here') {
        checks.push(this.checkVirusTotal(normalizedURL));
      }

      checks.push(this.domainAnalysis(normalizedURL));

      const results = await Promise.allSettled(checks);
      
      const processedResults = results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return { score: 0, indicators: [] };
      });

      const finalResult = this.aggregateResults(normalizedURL, processedResults);
      
      // Cache result
      await this.storeScanResult(finalResult);

      return finalResult;
    } catch (error) {
      console.error('URL scan failed:', error);
      return {
        url,
        isThreat: false,
        riskScore: 0,
        threatType: 'Scan Failed',
        indicators: ['Could not complete scan'],
        recommendation: 'Unable to verify URL safety. Exercise caution.'
      };
    }
  }

  private async checkGoogleSafeBrowsing(url: string): Promise<{ score: number; indicators: string[] }> {
    try {
      const response = await axios.post(
        `${env.APIs.GOOGLE_SAFE_BROWSING}?key=${env.GOOGLE_SAFE_BROWSING_API_KEY}`,
        {
          client: { 
            clientId: 'shieldnet-secure', 
            clientVersion: '1.0.0' 
          },
          threatInfo: {
            threatTypes: [
              'MALWARE', 
              'SOCIAL_ENGINEERING', 
              'UNWANTED_SOFTWARE', 
              'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANDROID'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        },
        { timeout: env.API_TIMEOUT }
      );

      if (response.data?.matches) {
        return { 
          score: 90, 
          indicators: ['Flagged by Google Safe Browsing'] 
        };
      }
      return { score: 0, indicators: [] };
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('Google Safe Browsing API rate limit reached');
      }
      return { score: 0, indicators: [] };
    }
  }

  private async checkVirusTotal(url: string): Promise<{ score: number; indicators: string[] }> {
    try {
      const response = await axios.get(env.APIs.VIRUSTOTAL, {
        params: {
          apikey: env.VIRUSTOTAL_API_KEY,
          resource: url,
        },
        timeout: env.API_TIMEOUT,
      });

      if (response.data?.positives > 0) {
        return {
          score: Math.min(response.data.positives * 10, 100),
          indicators: [`Detected by ${response.data.positives} security vendors`]
        };
      }
      return { score: 0, indicators: [] };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private async checkURLScanIO(url: string): Promise<{ score: number; indicators: string[] }> {
    try {
      const response = await axios.post(
        env.APIs.URLSCAN,
        { url, visibility: 'public' },
        { 
          headers: { 
            'API-Key': env.URLSCAN_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: env.API_TIMEOUT,
        }
      );

      if (response.data?.verdicts?.overall?.malicious) {
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

  private async checkPhishTank(url: string): Promise<{ score: number; indicators: string[] }> {
    try {
      const formData = new URLSearchParams();
      formData.append('url', url);
      formData.append('format', 'json');
      
      const response = await axios.post(
        env.APIs.PHISHTANK,
        formData,
        { 
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: env.API_TIMEOUT,
        }
      );

      if (response.data?.results?.in_database) {
        return { 
          score: 85, 
          indicators: ['Found in PhishTank phishing database'] 
        };
      }
      return { score: 0, indicators: [] };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private async heuristicAnalysis(url: string): Promise<{ score: number; indicators: string[] }> {
    const indicators: string[] = [];
    let score = 0;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // IP address check
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        score += 30;
        indicators.push('IP address used instead of domain name');
      }

      // Suspicious TLD check
      const matchedTLD = this.suspiciousTLDs.find(tld => hostname.endsWith(tld));
      if (matchedTLD) {
        score += 25;
        indicators.push(`Suspicious top-level domain detected: ${matchedTLD}`);
      }

      // Subdomain count
      const subdomainCount = hostname.split('.').length - 2;
      if (subdomainCount > 3) {
        score += 20;
        indicators.push(`Excessive subdomains: ${subdomainCount + 2}`);
      }

      // URL length
      if (url.length > 100) {
        score += 10;
        indicators.push('Unusually long URL');
      }

      // @ symbol
      if (url.includes('@')) {
        score += 30;
        indicators.push('URL contains @ symbol - possible credential harvesting');
      }

      // Phishing keywords
      const foundKeywords = this.phishingKeywords.filter(keyword => url.includes(keyword));
      if (foundKeywords.length > 0) {
        score += Math.min(foundKeywords.length * 10, 50);
        indicators.push(`Contains suspicious keywords: ${foundKeywords.slice(0, 3).join(', ')}`);
      }

      // Brand impersonation
      const brands = ['paypal', 'apple', 'google', 'microsoft', 'amazon', 'facebook', 'netflix', 'bank'];
      for (const brand of brands) {
        if (hostname.includes(brand) && !this.trustedDomains.some(d => hostname.endsWith(d))) {
          if (!hostname.endsWith(`${brand}.com`) && !hostname.endsWith(`${brand}.org`)) {
            score += 35;
            indicators.push(`Potential ${brand} brand impersonation`);
            break;
          }
        }
      }

      // HTTPS check
      if (!url.startsWith('https://')) {
        score += 5;
        indicators.push('Not using HTTPS');
      }

      return { score: Math.min(score, 100), indicators };
    } catch (error) {
      return { score: 50, indicators: ['Invalid URL format'] };
    }
  }

  private async domainAnalysis(url: string): Promise<{ score: number; indicators: string[] }> {
    try {
      const urlObj = new URL(url);
      const indicators: string[] = [];
      let score = 0;

      try {
        const whoisResponse = await axios.get(
          `${env.APIs.WHOIS}?q=${urlObj.hostname}`,
          { timeout: env.API_TIMEOUT }
        );

        const data = whoisResponse.data;
        if (data?.creation_date) {
          const creationDate = new Date(data.creation_date);
          const daysOld = (Date.now() - creationDate.getTime()) / (1000 * 3600 * 24);
          
          if (daysOld < 7) {
            score += 45;
            indicators.push('Domain registered within the last week');
          } else if (daysOld < 30) {
            score += 35;
            indicators.push('Domain registered within the last month');
          } else if (daysOld < 90) {
            score += 20;
            indicators.push('Domain registered within the last 3 months');
          }
        }
      } catch (whoisError) {
        // WHOIS lookup failed, skip
      }

      return { score, indicators };
    } catch (error) {
      return { score: 0, indicators: [] };
    }
  }

  private isShortenedURL(url: string): boolean {
    const shorteners = [
      'bit.ly', 'goo.gl', 't.co', 'tinyurl.com', 'ow.ly',
      'is.gd', 'buff.ly', 'adf.ly', 'shorte.st', 'bc.vc',
      'tiny.cc', 'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv'
    ];
    return shorteners.some(s => url.includes(s));
  }

  private async expandURL(shortURL: string): Promise<string> {
    try {
      const response = await axios.head(shortURL, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: env.API_TIMEOUT,
      });

      const location = response.headers.location;
      if (location) {
        if (this.isShortenedURL(location)) {
          return this.expandURL(location);
        }
        return location;
      }
      return shortURL;
    } catch (error: any) {
      if (error.response?.headers?.location) {
        const location = error.response.headers.location;
        if (this.isShortenedURL(location)) {
          return this.expandURL(location);
        }
        return location;
      }
      return shortURL;
    }
  }

  private async checkLocalDatabase(url: string): Promise<URLScanResult | null> {
    try {
      const stored = await AsyncStorage.getItem('threat_database');
      if (stored) {
        const threats = JSON.parse(stored);
        const urlObj = new URL(url);
        
        const match = threats.find((t: any) => {
          if (t.domain && urlObj.hostname.includes(t.domain)) return true;
          if (t.url && url.includes(t.url)) return true;
          return false;
        });

        if (match) {
          return {
            url,
            isThreat: true,
            riskScore: match.riskScore || 80,
            threatType: match.threatType || 'Known Threat',
            indicators: match.indicators || ['Previously detected in local database'],
            recommendation: 'This URL was previously identified as malicious. Avoid visiting.'
          };
        }
      }
    } catch (error) {
      console.error('Error checking local database:', error);
    }
    return null;
  }

  private async storeScanResult(result: URLScanResult): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scan_history');
      const history = stored ? JSON.parse(stored) : [];
      
      history.unshift({
        ...result,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });

      const trimmed = history.slice(0, env.MAX_SCAN_HISTORY);
      await AsyncStorage.setItem('scan_history', JSON.stringify(trimmed));

      if (result.isThreat) {
        const threatStored = await AsyncStorage.getItem('threat_database');
        const threats = threatStored ? JSON.parse(threatStored) : [];
        
        const urlObj = new URL(result.url);
        threats.unshift({
          id: Date.now().toString(),
          domain: urlObj.hostname,
          url: result.url,
          riskScore: result.riskScore,
          threatType: result.threatType,
          indicators: result.indicators,
          timestamp: new Date().toISOString(),
          reportCount: 1
        });

        await AsyncStorage.setItem('threat_database', JSON.stringify(threats.slice(0, 10000)));
      }
    } catch (error) {
      console.error('Error storing scan result:', error);
    }
  }

  private aggregateResults(url: string, results: any[]): URLScanResult {
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const allIndicators = results.flatMap(r => r.indicators || []);
    const uniqueIndicators = [...new Set(allIndicators)];
    const averageScore = Math.round(Math.min(totalScore / results.length, 100));

    return {
      url,
      isThreat: averageScore >= 50,
      riskScore: averageScore,
      threatType: this.determineThreatType(uniqueIndicators),
      indicators: uniqueIndicators,
      recommendation: this.generateRecommendation(averageScore)
    };
  }

  private determineThreatType(indicators: string[]): string {
    const indicatorString = indicators.join(' ').toLowerCase();
    
    if (/phishing|credential|login|password|verify|account/i.test(indicatorString)) {
      return 'Phishing Attack';
    }
    if (/malware|trojan|virus|ransomware|download/i.test(indicatorString)) {
      return 'Malware Distribution';
    }
    if (/scam|fraud|fake|lottery|prize|winner/i.test(indicatorString)) {
      return 'Scam';
    }
    if (/casino|gambling|bet|poker|slot/i.test(indicatorString)) {
      return 'Gambling';
    }
    if (/impersonat|spoof|fake.*(bank|paypal|apple|google)/i.test(indicatorString)) {
      return 'Impersonation';
    }
    if (/crypto|bitcoin|investment|trading/i.test(indicatorString)) {
      return 'Investment Scam';
    }
    return 'Suspicious Activity';
  }

  private generateRecommendation(score: number): string {
    if (score >= 90) {
      return 'CRITICAL: This URL is extremely dangerous. Do not visit under any circumstances. Report to cybersecurity authorities.';
    }
    if (score >= 75) {
      return 'HIGH RISK: This URL shows strong indicators of malicious activity. Avoid visiting and report if encountered.';
    }
    if (score >= 50) {
      return 'SUSPICIOUS: Multiple warning signs detected. Exercise extreme caution if you must visit this URL.';
    }
    if (score >= 25) {
      return 'CAUTION: Some suspicious indicators found. Verify the source before proceeding.';
    }
    return 'This URL appears to be safe based on our analysis. Always practice safe browsing habits.';
  }
}

export const urlScanner = new URLScanner();
