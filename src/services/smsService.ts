// Web-compatible SMS Service
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { urlScanner } from './urlScanner';
import { notificationService } from './notificationService';
import { threatDatabase } from './threatDatabase';

class SMSService {
  async initialize() {
    console.log('SMS service initialized (web-compatible)');
  }

  startMonitoring() {}
  continueBackgroundMonitoring() {}

  async scanMessage(message: string, sender: string = '') {
    try {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = message.match(urlRegex) || [];
      if (urls.length === 0) return { isThreat: false, riskScore: 0, urls: [], threatDetails: [] };

      const scamPatterns = await this.checkScamPatterns(message);
      const scanResults = await Promise.all(urls.map(url => urlScanner.scanURL(url)));

      const maxRiskScore = Math.max(...scanResults.map(r => r.riskScore), scamPatterns.length > 0 ? 70 : 0);
      const isThreat = maxRiskScore > 50;

      if (isThreat) {
        await this.storeThreatMessage(message, sender, [...scanResults, ...scamPatterns]);
        await notificationService.showThreatNotification({
          title: 'Security Threat Detected',
          body: 'Suspicious message detected.'
        });
      }

      return {
        isThreat,
        riskScore: maxRiskScore,
        urls: [...new Set(urls)],
        threatDetails: [...scanResults, ...scamPatterns]
      };
    } catch (error) {
      console.error('SMS scan error:', error);
      return { isThreat: false, riskScore: 0, urls: [], threatDetails: [] };
    }
  }

  private async checkScamPatterns(message: string) {
    const threats: any[] = [];
    const lowerMessage = message.toLowerCase();
    if (['casino', 'lottery', 'prize'].some(p => lowerMessage.includes(p))) {
      threats.push({ threatType: 'Scam', riskScore: 60, indicators: ['Suspicious content'] });
    }
    return threats;
  }

  private async storeThreatMessage(message: string, sender: string, threats: any[]) {
    const stored = await AsyncStorage.getItem('threat_messages');
    const messages = stored ? JSON.parse(stored) : [];
    messages.unshift({
      id: Date.now().toString(),
      message,
      sender,
      threats,
      timestamp: new Date().toISOString(),
      riskScore: Math.max(...threats.map((t: any) => t.riskScore || 0))
    });
    await AsyncStorage.setItem('threat_messages', JSON.stringify(messages.slice(0, 100)));
    await threatDatabase.reportThreat({ type: 'sms', content: message, sender, threats });
  }

  async reportMessage(messageId: string, reason: string) {
    console.log('Report message:', messageId, reason);
  }

  async getThreatMessages(limit: number = 50): Promise<any[]> {
    const stored = await AsyncStorage.getItem('threat_messages');
    return stored ? JSON.parse(stored).slice(0, limit) : [];
  }
}

export const smsService = new SMSService();
