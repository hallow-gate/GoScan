import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private readonly SIMILARITY_THRESHOLD = 0.6;

  async reportThreat(report: ThreatReport) {
    const stored = await AsyncStorage.getItem('threat_database');
    const threats = stored ? JSON.parse(stored) : [];
    
    threats.unshift({
      ...report,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      reportedAt: new Date().toISOString()
    });

    await AsyncStorage.setItem('threat_database', JSON.stringify(threats));
    
    // If it's a scammer number, store separately for quick lookup
    if (report.number) {
      await this.storeScammerNumber(report.number, report);
    }

    if (report.domain) {
      await this.storeMaliciousDomain(report.domain, report);
    }
  }

  async checkScammerNumber(number: string): Promise<boolean> {
    const stored = await AsyncStorage.getItem('scammer_numbers');
    if (!stored) return false;
    
    const numbers = JSON.parse(stored);
    return numbers.some((n: any) => {
      // Exact match
      if (n.number === number) return true;
      
      // Similar number (same prefix)
      if (number.length > 6 && n.number.startsWith(number.substring(0, 6))) {
        return true;
      }
      
      return false;
    });
  }

  async findSimilarThreats(content: string): Promise<any[]> {
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

    return similarThreats.slice(0, 5); // Return top 5 similar threats
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
    const stored = await AsyncStorage.getItem('scammer_numbers');
    const numbers = stored ? JSON.parse(stored) : [];
    
    numbers.unshift({
      number,
      reportCount: 1,
      firstReported: new Date().toISOString(),
      lastReported: new Date().toISOString(),
      reports: [report]
    });

    await AsyncStorage.setItem('scammer_numbers', JSON.stringify(numbers));
  }

  private async storeMaliciousDomain(domain: string, report: ThreatReport) {
    const stored = await AsyncStorage.getItem('malicious_domains');
    const domains = stored ? JSON.parse(stored) : [];
    
    domains.unshift({
      domain,
      riskScore: report.severity === 'high' ? 90 : 60,
      reportCount: 1,
      firstReported: new Date().toISOString(),
      lastReported: new Date().toISOString()
    });

    await AsyncStorage.setItem('malicious_domains', JSON.stringify(domains));
  }

  async getThreatStats() {
    const stored = await AsyncStorage.getItem('threat_database');
    const threats = stored ? JSON.parse(stored) : [];
    
    return {
      totalThreats: threats.length,
      todayThreats: threats.filter((t: any) => {
        const today = new Date();
        const threatDate = new Date(t.timestamp);
        return threatDate.toDateString() === today.toDateString();
      }).length,
      scammerCount: (await AsyncStorage.getItem('scammer_numbers') || '[]').length,
      maliciousDomains: (await AsyncStorage.getItem('malicious_domains') || '[]').length
    };
  }
}

export const threatDatabase = new ThreatDatabase();
