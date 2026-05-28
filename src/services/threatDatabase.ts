import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../utils/env';

interface ThreatReport {
  type: string;
  content: string;
  sender?: string;
  threats?: any[];
  reason?: string;
  severity?: string;
  domain?: string;
  number?: string;
  timestamp?: string;
}

class ThreatDatabase {
  private readonly SIMILARITY_THRESHOLD = env.SIMILARITY_THRESHOLD;
  private readonly MAX_THREATS = env.MAX_THREAT_DATABASE;

  async reportThreat(report: ThreatReport) {
    try {
      const stored = await AsyncStorage.getItem('threat_database');
      const threats = stored ? JSON.parse(stored) : [];
      
      threats.unshift({
        ...report,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        reportedAt: new Date().toISOString()
      });

      await AsyncStorage.setItem(
        'threat_database', 
        JSON.stringify(threats.slice(0, this.MAX_THREATS))
      );
      
      if (report.number) {
        await this.storeScammerNumber(report.number, report);
      }

      if (report.domain) {
        await this.storeMaliciousDomain(report.domain, report);
      }
    } catch (error) {
      console.error('Error reporting threat:', error);
    }
  }

  async checkScammerNumber(number: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem('scammer_numbers');
      if (!stored) return false;
      
      const numbers = JSON.parse(stored);
      return numbers.some((n: any) => {
        if (n.number === number) return true;
        if (number.length > 6 && n.number.startsWith(number.substring(0, 6))) {
          return true;
        }
        return false;
      });
    } catch (error) {
      console.error('Error checking scammer number:', error);
      return false;
    }
  }

  async findSimilarThreats(content: string): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('threat_database');
      if (!stored) return [];
      
      const threats = JSON.parse(stored);
      const similarThreats: any[] = [];

      threats.forEach((threat: any) => {
        const similarity = this.calculateSimilarity(
          content.toLowerCase(),
          (threat.content || threat.domain || '').toLowerCase()
        );

        if (similarity >= this.SIMILARITY_THRESHOLD) {
          similarThreats.push({
            ...threat,
            similarity: similarity * 100
          });
        }
      });

      return similarThreats.slice(0, 5);
    } catch (error) {
      console.error('Error finding similar threats:', error);
      return [];
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str1.length][str2.length];
  }

  private async storeScammerNumber(number: string, report: ThreatReport) {
    try {
      const stored = await AsyncStorage.getItem('scammer_numbers');
      const numbers = stored ? JSON.parse(stored) : [];
      
      const existing = numbers.find((n: any) => n.number === number);
      
      if (existing) {
        existing.reportCount += 1;
        existing.lastReported = new Date().toISOString();
        existing.reports.push(report);
      } else {
        numbers.unshift({
          number,
          reportCount: 1,
          firstReported: new Date().toISOString(),
          lastReported: new Date().toISOString(),
          reports: [report]
        });
      }

      await AsyncStorage.setItem('scammer_numbers', JSON.stringify(numbers));
    } catch (error) {
      console.error('Error storing scammer number:', error);
    }
  }

  private async storeMaliciousDomain(domain: string, report: ThreatReport) {
    try {
      const stored = await AsyncStorage.getItem('malicious_domains');
      const domains = stored ? JSON.parse(stored) : [];
      
      const existing = domains.find((d: any) => d.domain === domain);
      
      if (existing) {
        existing.reportCount += 1;
        existing.lastReported = new Date().toISOString();
        existing.riskScore = Math.max(
          existing.riskScore, 
          report.severity === 'high' ? 90 : 60
        );
      } else {
        domains.unshift({
          domain,
          riskScore: report.severity === 'high' ? 90 : 60,
          reportCount: 1,
          firstReported: new Date().toISOString(),
          lastReported: new Date().toISOString()
        });
      }

      await AsyncStorage.setItem('malicious_domains', JSON.stringify(domains));
    } catch (error) {
      console.error('Error storing malicious domain:', error);
    }
  }

  async getThreatStats() {
    try {
      const stored = await AsyncStorage.getItem('threat_database');
      const threats = stored ? JSON.parse(stored) : [];
      
      const today = new Date();
      
      return {
        totalThreats: threats.length,
        todayThreats: threats.filter((t: any) => {
          const threatDate = new Date(t.timestamp);
          return threatDate.toDateString() === today.toDateString();
        }).length,
        scammerCount: (await this.getScammerCount()),
        maliciousDomains: (await this.getMaliciousDomainCount())
      };
    } catch (error) {
      console.error('Error getting threat stats:', error);
      return {
        totalThreats: 0,
        todayThreats: 0,
        scammerCount: 0,
        maliciousDomains: 0
      };
    }
  }

  private async getScammerCount(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem('scammer_numbers');
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  }

  private async getMaliciousDomainCount(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem('malicious_domains');
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  }

  async clearDatabase() {
    try {
      await AsyncStorage.removeItem('threat_database');
      await AsyncStorage.removeItem('scammer_numbers');
      await AsyncStorage.removeItem('malicious_domains');
    } catch (error) {
      console.error('Error clearing database:', error);
    }
  }

  async exportThreats(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('threat_database');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error exporting threats:', error);
      return [];
    }
  }

  async importThreats(threats: any[]) {
    try {
      await AsyncStorage.setItem('threat_database', JSON.stringify(threats));
    } catch (error) {
      console.error('Error importing threats:', error);
    }
  }
}

export const threatDatabase = new ThreatDatabase();
