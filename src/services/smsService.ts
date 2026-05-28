import * as SMS from 'expo-sms';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { urlScanner } from './urlScanner';
import { notificationService } from './notificationService';
import { threatDatabase } from './threatDatabase';
import env from '../utils/env';

class SMSService {
  private monitoringActive = false;
  private processedMessages = new Set<string>();
  private readonly SCAN_INTERVAL = env.SMS_SCAN_INTERVAL;
  private readonly MAX_MESSAGES = env.SMS_MAX_MESSAGES;

  async initialize() {
    // Check if SMS monitoring is enabled
    if (!env.SMS_MONITORING_ENABLED) {
      console.log('SMS monitoring is disabled in configuration');
      return;
    }

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

  startMonitoring() {
    if (Platform.OS === 'android' && this.monitoringActive) {
      // Clear old processed messages periodically
      setInterval(() => {
        if (this.processedMessages.size > 1000) {
          this.processedMessages.clear();
        }
      }, 3600000); // Clear every hour

      if (env.APP_DEBUG) {
        console.log('SMS monitoring started');
      }
    }
  }

  continueBackgroundMonitoring() {
    if (env.ENABLE_BACKGROUND_MONITORING && this.monitoringActive) {
      if (env.APP_DEBUG) {
        console.log('SMS background monitoring active');
      }
    }
  }

  async scanMessage(message: string, sender: string = ''): Promise<{
    isThreat: boolean;
    riskScore: number;
    urls: string[];
    threatDetails: any[];
  }> {
    try {
      // Check if message was already processed
      const messageHash = this.hashMessage(message);
      if (this.processedMessages.has(messageHash)) {
        return {
          isThreat: false,
          riskScore: 0,
          urls: [],
          threatDetails: []
        };
      }

      // Add to processed set
      this.processedMessages.add(messageHash);

      // Extract URLs from message
      const urls = this.extractURLs(message);
      
      if (urls.length === 0) {
        // Check for text-based scams even without URLs
        const scamPatterns = await this.checkScamPatterns(message, sender);
        if (scamPatterns.length > 0) {
          const riskScore = Math.max(...scamPatterns.map(p => p.riskScore));
          if (riskScore > 50) {
            await this.handleThreat(message, sender, scamPatterns, riskScore);
          }
          return {
            isThreat: riskScore > 50,
            riskScore,
            urls: [],
            threatDetails: scamPatterns
          };
        }
        
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
        scamPatterns.length > 0 ? Math.max(...scamPatterns.map(p => p.riskScore)) : 0
      );

      const isThreat = maxRiskScore > 50 || threatDetails.length > 0;

      // Handle threat if detected
      if (isThreat) {
        await this.handleThreat(message, sender, threatDetails, maxRiskScore);
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

  private async handleThreat(
    message: string, 
    sender: string, 
    threats: any[], 
    riskScore: number
  ) {
    // Store threat in database
    await this.storeThreatMessage(message, sender, threats);
    
    // Send notification
    await notificationService.showThreatNotification({
      title: 'Security Threat Detected',
      body: 'Suspicious message detected. Do not click any links or respond.',
      data: { message, sender, riskScore }
    });
  }

  private async checkScamPatterns(message: string, sender: string): Promise<any[]> {
    const threats: any[] = [];
    const lowerMessage = message.toLowerCase();

    // Casino/Gambling patterns
    const gamblingPatterns = [
      'casino', 'slot', 'poker', 'blackjack', 'roulette',
      'betting', 'wager', 'jackpot', 'lottery', 'prize',
      'winning', 'claim prize', 'free spins', 'bonus',
      'gambling', 'baccarat', 'craps'
    ];

    const foundGambling = gamblingPatterns.filter(p => lowerMessage.includes(p));
    if (foundGambling.length > 0) {
      threats.push({
        threatType: 'Gambling/Scam',
        riskScore: 70,
        indicators: [
          'Contains gambling-related content',
          `Keywords: ${foundGambling.slice(0, 3).join(', ')}`
        ]
      });
    }

    // Banking scams
    const bankingPatterns = [
      'bank', 'account', 'transfer', 'balance', 'deposit',
      'withdraw', 'transaction', 'otp', 'pin', 'password',
      'verify your', 'update your', 'suspended', 'limited'
    ];

    const foundBanking = bankingPatterns.filter(p => lowerMessage.includes(p));
    if (foundBanking.length >= 2) {
      threats.push({
        threatType: 'Banking Scam',
        riskScore: 85,
        indicators: [
          'Contains banking-related keywords',
          'Potential credential harvesting attempt'
        ]
      });
    }

    // Investment scams
    const investmentPatterns = [
      'investment', 'profit', 'earn', 'crypto', 'bitcoin',
      'trading', 'forex', 'double your', 'guaranteed return',
      'passive income', 'work from home', 'make money'
    ];

    const foundInvestment = investmentPatterns.filter(p => lowerMessage.includes(p));
    if (foundInvestment.length >= 2) {
      threats.push({
        threatType: 'Investment Scam',
        riskScore: 75,
        indicators: [
          'Contains investment scam keywords',
          'Promises unrealistic returns'
        ]
      });
    }

    // Urgency/Social engineering
    const urgencyPatterns = [
      'urgent', 'immediately', 'act now', 'limited time',
      'expires', 'don\'t miss', 'exclusive', 'congratulations',
      'you won', 'selected'
    ];

    const foundUrgency = urgencyPatterns.filter(p => lowerMessage.includes(p));
    if (foundUrgency.length > 0) {
      threats.push({
        threatType: 'Social Engineering',
        riskScore: 65,
        indicators: [
          'Uses urgency or pressure tactics',
          'Creates false sense of exclusivity'
        ]
      });
    }

    // Check sender against known scam numbers
    if (sender) {
      const isScammer = await threatDatabase.checkScammerNumber(sender);
      if (isScammer) {
        threats.push({
          threatType: 'Known Scammer',
          riskScore: 95,
          indicators: ['Number previously reported as scam source']
        });
      }
    }

    // Check message similarity with known scams
    const similarThreats = await threatDatabase.findSimilarThreats(message);
    if (similarThreats.length > 0) {
      threats.push({
        threatType: 'Similar to Known Scam',
        riskScore: 80,
        indicators: [
          'Message matches known scam patterns',
          `${similarThreats.length} similar threats found`
        ]
      });
    }

    return threats;
  }

  private async storeThreatMessage(
    message: string, 
    sender: string, 
    threats: any[]
  ) {
    try {
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

      await AsyncStorage.setItem(
        'threat_messages', 
        JSON.stringify(messages.slice(0, this.MAX_MESSAGES))
      );
      
      // Report to threat database
      await threatDatabase.reportThreat({
        type: 'sms',
        content: message,
        sender,
        threats,
        severity: threats.some((t: any) => t.riskScore >= 80) ? 'high' : 'medium'
      });
    } catch (error) {
      console.error('Error storing threat message:', error);
    }
  }

  private extractURLs(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]+)|([^\s]+\.[a-z]{2,}\/[^\s]*)/gi;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches)];
  }

  private hashMessage(message: string): string {
    // Simple hash for message deduplication
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  async reportMessage(messageId: string, reason: string) {
    try {
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
    } catch (error) {
      console.error('Error reporting message:', error);
    }
  }

  async getThreatMessages(limit: number = 50): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('threat_messages');
      if (stored) {
        const messages = JSON.parse(stored);
        return messages.slice(0, limit);
      }
    } catch (error) {
      console.error('Error getting threat messages:', error);
    }
    return [];
  }

  async clearMessages() {
    try {
      await AsyncStorage.removeItem('threat_messages');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }
}

export const smsService = new SMSService();
