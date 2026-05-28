import { urlScanner } from './urlScanner';
import { threatDatabase } from './threatDatabase';
import * as Clipboard from 'expo-clipboard';

class SecurityAnalyzer {
  async analyzeClipboard(): Promise<{
    hasLinks: boolean;
    threats: any[];
    recommendation: string;
  }> {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (!clipboardContent) {
        return { hasLinks: false, threats: [], recommendation: 'No content in clipboard' };
      }

      const urls = this.extractURLs(clipboardContent);
      if (urls.length === 0) {
        return { hasLinks: false, threats: [], recommendation: 'No URLs found in clipboard' };
      }

      const results = await Promise.all(
        urls.map(url => urlScanner.scanURL(url))
      );

      const threats = results.filter(r => r.isThreat);
      const hasThreats = threats.length > 0;

      return {
        hasLinks: true,
        threats: results,
        recommendation: hasThreats
          ? 'Dangerous links detected in clipboard! Be careful before pasting.'
          : 'Clipboard links appear safe',
      };
    } catch (error) {
      console.error('Clipboard analysis error:', error);
      return { hasLinks: false, threats: [], recommendation: 'Unable to analyze clipboard' };
    }
  }

  async checkPasswordStrength(password: string): Promise<{
    score: number;
    strength: string;
    suggestions: string[];
    timeToCrack: string;
  }> {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else suggestions.push('Use at least 8 characters');

    if (/[A-Z]/.test(password)) score += 15;
    else suggestions.push('Add uppercase letters');

    if (/[a-z]/.test(password)) score += 15;
    else suggestions.push('Add lowercase letters');

    if (/[0-9]/.test(password)) score += 15;
    else suggestions.push('Add numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    else suggestions.push('Add special characters');

    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      suggestions.push('Avoid repeated characters');
    }

    const strength = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Weak';
    
    const timeToCrack = this.estimateCrackTime(password);

    return { score, strength, suggestions, timeToCrack };
  }

  private estimateCrackTime(password: string): string {
    const entropy = this.calculateEntropy(password);
    const guessesPerSecond = 1000000000; // 1 billion guesses per second
    
    const seconds = Math.pow(2, entropy) / guessesPerSecond;
    
    if (seconds < 60) return 'Instantly';
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    return `${Math.round(seconds / 31536000)} years`;
  }

  private calculateEntropy(password: string): number {
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/[0-9]/.test(password)) charset += 10;
    if (/[^A-Za-z0-9]/.test(password)) charset += 32;
    
    return Math.log2(Math.pow(charset, password.length));
  }

  async checkVPNStatus(): Promise<{
    isVPN: boolean;
    security: string;
    recommendation: string;
  }> {
    // In a real app, this would check for VPN interfaces
    // For now, return a simulated result
    return {
      isVPN: false,
      security: 'Direct Connection',
      recommendation: 'Using a VPN can add extra security when on public WiFi',
    };
  }

  async monitorInternetConnection(): Promise<{
    isConnected: boolean;
    type: string;
    isSecure: boolean;
    recommendation: string;
  }> {
    // This would use NetInfo in production
    return {
      isConnected: true,
      type: 'WiFi',
      isSecure: true,
      recommendation: 'Your connection appears secure',
    };
  }

  private extractURLs(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return text.match(urlRegex) || [];
  }
}

export const securityAnalyzer = new SecurityAnalyzer();
