import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/common/GlassCard';
import { securityAnalyzer } from '../services/securityAnalyzer';
import { urlScanner } from '../services/urlScanner';
import { validateURL, getRiskColor } from '../utils/helpers';

interface ToolResult {
  type: string;
  data: any;
  timestamp: string;
}

export const SecurityToolsScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [checkUrl, setCheckUrl] = useState('');
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState<ToolResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tools = [
    {
      id: 'password',
      title: 'Password Strength Checker',
      icon: 'key',
      color: '#8b5cf6',
      description: 'Check if your password is strong enough',
    },
    {
      id: 'url',
      title: 'URL Safety Checker',
      icon: 'link',
      color: '#3b82f6',
      description: 'Verify if a URL is safe to visit',
    },
    {
      id: 'domain',
      title: 'Domain Analyzer',
      icon: 'globe',
      color: '#10b981',
      description: 'Analyze domain reputation and age',
    },
    {
      id: 'https',
      title: 'HTTPS Verifier',
      icon: 'lock-closed',
      color: '#f59e0b',
      description: 'Check website security certificates',
    },
    {
      id: 'ip',
      title: 'IP Address Checker',
      icon: 'server',
      color: '#ec4899',
      description: 'Check IP address information',
    },
    {
      id: 'dns',
      title: 'DNS Lookup',
      icon: 'search',
      color: '#06b6d4',
      description: 'Look up DNS records',
    },
    {
      id: 'vpn',
      title: 'VPN Status Detector',
      icon: 'shield',
      color: '#ef4444',
      description: 'Check if you are using a VPN',
    },
    {
      id: 'clipboard',
      title: 'Clipboard Scanner',
      icon: 'clipboard',
      color: '#6366f1',
      description: 'Scan clipboard for malicious links',
    },
  ];

  const handlePasswordCheck = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await securityAnalyzer.checkPasswordStrength(password);
      addResult('password', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to check password');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleURLCheck = async () => {
    if (!checkUrl || !validateURL(checkUrl)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await urlScanner.scanURL(checkUrl);
      addResult('url', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to check URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDomainCheck = async () => {
    if (!domain) {
      Alert.alert('Error', 'Please enter a domain');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await urlScanner.scanURL(`https://${domain}`);
      addResult('domain', {
        domain,
        isSuspicious: result.isThreat,
        riskScore: result.riskScore,
        indicators: result.indicators,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze domain');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVPNCheck = async () => {
    setIsAnalyzing(true);
    try {
      const result = await securityAnalyzer.checkVPNStatus();
      addResult('vpn', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to check VPN status');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClipboardScan = async () => {
    setIsAnalyzing(true);
    try {
      const result = await securityAnalyzer.analyzeClipboard();
      addResult('clipboard', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan clipboard');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addResult = (type: string, data: any) => {
    const newResult: ToolResult = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    setResults(prev => [newResult, ...prev].slice(0, 10));
  };

  const renderPasswordResult = (data: any) => (
    <View style={styles.resultContent}>
      <View style={styles.scoreCircle}>
        <Text style={[styles.scoreValue, { color: getRiskColor(100 - data.score) }]}>
          {data.score}
        </Text>
        <Text style={[styles.scoreLabel, { color: colors.subtext }]}>Score</Text>
      </View>
      
      <View style={styles.strengthBar}>
        <View style={[
          styles.strengthFill,
          { width: `${data.score}%`, backgroundColor: getRiskColor(100 - data.score) }
        ]} />
      </View>
      
      <Text style={[styles.strengthText, { color: getRiskColor(100 - data.score) }]}>
        {data.strength}
      </Text>
      
      <Text style={[styles.resultLabel, { color: colors.text }]}>
        Time to crack: {data.timeToCrack}
      </Text>
      
      {data.suggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          <Text style={[styles.suggestionTitle, { color: colors.warning }]}>
            Suggestions:
          </Text>
          {data.suggestions.map((suggestion: string, index: number) => (
            <Text key={index} style={[styles.suggestionItem, { color: colors.subtext }]}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderURLResult = (data: any) => (
    <View style={styles.resultContent}>
      <View style={[styles.statusBadge, { 
        backgroundColor: data.isThreat ? colors.danger + '20' : colors.success + '20' 
      }]}>
        <Ionicons
          name={data.isThreat ? 'warning' : 'checkmark-circle'}
          size={24}
          color={data.isThreat ? colors.danger : colors.success}
        />
        <Text style={[styles.statusText, { 
          color: data.isThreat ? colors.danger : colors.success 
        }]}>
          {data.isThreat ? 'Threat Detected' : 'URL Safe'}
        </Text>
      </View>
      
      <Text style={[styles.resultLabel, { color: colors.text }]}>
        Risk Score: {data.riskScore}/100
      </Text>
      
      {data.indicators.length > 0 && (
        <View style={styles.indicatorsList}>
          {data.indicators.map((indicator: string, index: number) => (
            <View key={index} style={styles.indicatorBadge}>
              <Text style={styles.indicatorText}>{indicator}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const getToolContent = (toolId: string) => {
    switch (toolId) {
      case 'password':
        return (
          <View>
            <TextInput
              style={[styles.toolInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter password to check..."
              placeholderTextColor={colors.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              onPress={handlePasswordCheck}
              disabled={isAnalyzing}
              style={[styles.toolButton, { opacity: isAnalyzing ? 0.5 : 1 }]}
            >
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.toolButtonGradient}>
                <Ionicons name="key" size={20} color="#fff" />
                <Text style={styles.toolButtonText}>Check Strength</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'url':
        return (
          <View>
            <TextInput
              style={[styles.toolInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter URL to check..."
              placeholderTextColor={colors.subtext}
              value={checkUrl}
              onChangeText={setCheckUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity
              onPress={handleURLCheck}
              disabled={isAnalyzing}
              style={[styles.toolButton, { opacity: isAnalyzing ? 0.5 : 1 }]}
            >
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.toolButtonGradient}>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.toolButtonText}>Check URL</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'domain':
        return (
          <View>
            <TextInput
              style={[styles.toolInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter domain (e.g., example.com)..."
              placeholderTextColor={colors.subtext}
              value={domain}
              onChangeText={setDomain}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={handleDomainCheck}
              disabled={isAnalyzing}
              style={[styles.toolButton, { opacity: isAnalyzing ? 0.5 : 1 }]}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.toolButtonGradient}>
                <Ionicons name="globe" size={20} color="#fff" />
                <Text style={styles.toolButtonText}>Analyze Domain</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#0a0e21'] : ['#e0e7ff', '#ffffff']}
        style={styles.gradient}
      >
        <Text style={[styles.title, { color: colors.text }]}>Security Tools</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Useful utilities for enhanced security
        </Text>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
            >
              <GlassCard style={[
                styles.toolCard,
                activeTool === tool.id && { borderColor: tool.color, borderWidth: 1 }
              ]}>
                <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                  <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>
                  {tool.title}
                </Text>
                <Text style={[styles.toolDescription, { color: colors.subtext }]}>
                  {tool.description}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Tool Panel */}
        {activeTool && (
          <GlassCard style={styles.activeToolPanel}>
            <View style={styles.activeToolHeader}>
              <Text style={[styles.activeToolTitle, { color: colors.text }]}>
                {tools.find(t => t.id === activeTool)?.title}
              </Text>
              <TouchableOpacity onPress={() => setActiveTool(null)}>
                <Ionicons name="close" size={24} color={colors.subtext} />
              </TouchableOpacity>
            </View>
            
            {getToolContent(activeTool)}

            {/* Tool Results */}
            {results.filter(r => r.type === activeTool).map((result, index) => (
              <View key={index} style={styles.resultContainer}>
                {result.type === 'password' && renderPasswordResult(result.data)}
                {result.type === 'url' && renderURLResult(result.data)}
                {result.type === 'domain' && renderURLResult(result.data)}
              </View>
            ))}
          </GlassCard>
        )}

        {/* Quick Actions */}
        <GlassCard style={styles.quickActionsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              onPress={handleClipboardScan}
              style={[styles.quickAction, { backgroundColor: colors.primary + '20' }]}
            >
              <Ionicons name="clipboard" size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>
                Scan Clipboard
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleVPNCheck}
              style={[styles.quickAction, { backgroundColor: colors.warning + '20' }]}
            >
              <Ionicons name="shield" size={24} color={colors.warning} />
              <Text style={[styles.quickActionText, { color: colors.warning }]}>
                Check VPN
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    minHeight: '100%',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toolCard: {
    width: (Dimensions.get('window').width - 60) / 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  toolDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  activeToolPanel: {
    padding: 20,
    marginBottom: 20,
  },
  activeToolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activeToolTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  toolInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 12,
  },
  toolButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toolButtonGradient: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  toolButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resultContent: {
    gap: 12,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
  },
  strengthBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultLabel: {
    fontSize: 14,
  },
  suggestionsList: {
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  indicatorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  indicatorBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  indicatorText: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
