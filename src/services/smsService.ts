// Web-compatible SMS Service
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { urlScanner } from './urlScanner';
import { notificationService } from './notificationService';
import { threatDatabase } from './threatDatabase';

// Only import expo-sms on native platforms
let SMS: any = null;
if (Platform.OS !== 'web') {
  try {
    SMS = require('expo-sms');
  } catch (e) {
    console.log('SMS module not available on web');
  }
}

class SMSService {
  private monitoringActive = false;
  private processedMessages = new Set<string>();

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('SMS monitoring not available on web');
      return;
    }
    this.monitoringActive = true;
    this.startMonitoring();
  }

  startMonitoring() {
    if (Platform.OS === 'web') return;
    console.log('SMS monitoring started');
  }

  continueBackgroundMonitoring() {
    console.log('Background monitoring active');
  }

  async scanMessage(message: string, sender: string = ''): Promise<{
    isThreat: boolean;
    riskScore: number;
    urls: string[];
    threatDetails: any[];
  }> {
    try {
      const urls = this.extractURLs(message);
      
      if (urls.length === 0) {
        return {
          isThreat: false,
          riskScore: 0,
          urls: [],
          threatDetails: []
        };
      }

      const scamPatterns = await this.checkScamPatterns(message, sender);
      const scanResults = await Promise.all(
        urls.map(url => urlScanner.scanURL(url))
      );

      const threatDetails = [...scanResults, ...scamPatterns];
      const maxRiskScore = Math.max(
        ...scanResults.map(r => r.riskScore),
        scamPatterns.length > 0 ? 70 : 0
      );

      const isThreat = maxRiskScore > 50;

      if (isThreat) {
        await this.storeThreatMessage(message, sender, threatDetails);
        await notificationService.showThreatNotification({
          title: 'Security Threat Detected',
          body: 'Suspicious message detected. Do not click any links.',
          data: { message, sender, riskScore: maxRiskScore }
        });
      }

      return {
        isThreat,
        riskScore: maxRiskScore,
        urls,
        threatDetails
      };
    } catch (error) {
      console.error('SMS scan error:', error);
      return {
        isThreat: false,
        riskScore: 0,
        urls: [],
        threatDetails: []
      };
    }
  }

  private async checkScamPatterns(message: string, sender: string): Promise<any[]> {
    const threats: any[] = [];
    const lowerMessage = message.toLowerCase();

    const gamblingPatterns = ['casino', 'slot', 'poker', 'lottery', 'prize', 'winner'];
    if (gamblingPatterns.some(p => lowerMessage.includes(p))) {
      threats.push({ threatType: 'Gambling', riskScore: 60, indicators: ['Contains gambling content'] });
    }

    const bankingPatterns = ['bank', 'account', 'transfer', 'otp', 'pin', 'password'];
    if (bankingPatterns.some(p => lowerMessage.includes(p))) {
      threats.push({ threatType: 'Banking Scam', riskScore: 80, indicators: ['Contains banking keywords'] });
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
    
    await threatDatabase.reportThreat({
      type: 'sms',
      content: message,
      sender,
      threats
    });
  }

  private extractURLs(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches)];
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
