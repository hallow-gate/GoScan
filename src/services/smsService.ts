import * as SMS from 'expo-sms';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { urlScanner } from './urlScanner';
import { notificationService } from './notificationService';
import { threatDatabase } from './threatDatabase';

class SMSService {
  private monitoringActive = false;
  private processedMessages = new Set<string>();

  async initialize() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: 'SMS Monitoring Permission',
          message: 'ShieldNet needs SMS access to detect phishing and scam messages in real-time.',
          buttonPositive: 'Grant',
          buttonNegative: 'Deny'
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.monitoringActive = true;
        this.startMonitoring();
      }
    }
  }

  private startMonitoring() {
    // Register SMS received listener
    if (Platform.OS === 'android') {
      // This would use native SMS receiver in production
      // For now, we monitor clipboard and SMS access
      setInterval(() => this.checkForSMSMessages(), 5000);
    }
  }

  async scanMessage(message: string, sender: string = ''): Promise<{
    isThreat: boolean;
    riskScore: number;
    urls: string[];
    threatDetails: any[];
  }> {
    try {
      // Extract URLs from message
      const urls = this.extractURLs(message);
      
      if (urls.length === 0) {
        return {
          isThreat: false,
          riskScore: 0,
          urls: [],
          threatDetails: []
        };
      }

      // Check for known scam patterns
      const scamPatterns = await this.checkScamPatterns(message, sender);
      
      // Scan each URL
      const scanResults = await Promise.all(
        urls.map(url => urlScanner.scanURL(url))
      );

      // Aggregate threat assessment
      const threatDetails = [...scanResults];
      if (scamPatterns.length > 0) {
        threatDetails.push(...scamPatterns);
      }

      const maxRiskScore = Math.max(
        ...scanResults.map(r => r.riskScore),
        scamPatterns.length > 0 ? 70 : 0
      );

      const isThreat = maxRiskScore > 50 || threatDetails.length > 0;

      // Store message in database if threatening
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

    // Casino/Gambling patterns
    const gamblingPatterns = [
      'casino', 'slot', 'poker', 'blackjack', 'roulette',
      'betting', 'wager', 'jackpot', 'lottery', 'prize',
      'winning', 'claim prize', 'free spins', 'bonus'
    ];

    if (gamblingPatterns.some(p => lowerMessage.includes(p))) {
      threats.push({
        threatType: 'Gambling',
        riskScore: 60,
        indicators: ['Contains gambling-related content']
      });
    }

    // Banking scams
    const bankingPatterns = [
      'bank', 'account', 'transfer', 'balance', 'deposit',
      'withdraw', 'transaction', 'otp', 'pin', 'password'
    ];

    if (bankingPatterns.some(p => lowerMessage.includes(p))) {
      threats.push({
        threatType: 'Banking Scam',
        riskScore: 80,
        indicators: ['Contains banking-related keywords']
      });
    }

    // Investment scams
    const investmentPatterns = [
      'investment', 'profit', 'earn', 'crypto', 'bitcoin',
      'trading', 'forex', 'double', 'guaranteed return'
    ];

    if (investmentPatterns.some(p => lowerMessage.includes(p))) {
      threats.push({
        threatType: 'Investment Scam',
        riskScore: 75,
        indicators: ['Contains investment scam keywords']
      });
    }

    // Check sender against known scam numbers
    if (sender) {
      const isScammer = await threatDatabase.checkScammerNumber(sender);
      if (isScammer) {
        threats.push({
          threatType: 'Known Scammer',
          riskScore: 90,
          indicators: ['Number previously reported as scam']
        });
      }
    }

    // Check message similarity with known scams
    const similarThreats = await threatDatabase.findSimilarThreats(message);
    if (similarThreats.length > 0) {
      threats.push({
        threatType: 'Similar to Known Scam',
        riskScore: 70,
        indicators: ['Message matches known scam patterns']
      });
    }

    return threats;
  }

  private async storeThreatMessage(
    message: string, 
    sender: string, 
    threats: any[]
  ) {
    const stored = await AsyncStorage.getItem('threat_messages');
    const messages = stored ? JSON.parse(stored) : [];
    
    messages.unshift({
      id: Date.now().toString(),
      message,
      sender,
      threats,
      timestamp: new Date().toISOString(),
      riskScore: Math.max(...threats.map(t => t.riskScore))
    });

    await AsyncStorage.setItem('threat_messages', JSON.stringify(messages.slice(0, 100)));
    
    // Report to threat database
    await threatDatabase.reportThreat({
      type: 'sms',
      content: message,
      sender,
      threats
    });
  }

  private extractURLs(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]+)|([^\s]+\.[a-z]{2,}\/[^\s]*)/gi;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private async checkForSMSMessages() {
    if (!this.monitoringActive) return;
    
    try {
      // This would use native SMS content provider in production
      // For demonstration, we check clipboard for SMS-like content
    } catch (error) {
      console.error('SMS monitoring error:', error);
    }
  }

  async reportMessage(messageId: string, reason: string) {
    const stored = await AsyncStorage.getItem('threat_messages');
    const messages = stored ? JSON.parse(stored) : [];
    
    const message = messages.find((m: any) => m.id === messageId);
    if (message) {
      await threatDatabase.reportThreat({
        type: 'reported_sms',
        content: message.message,
        sender: message.sender,
        reason,
        severity: 'high'
      });
    }
  }
}

export const smsService = new SMSService();
