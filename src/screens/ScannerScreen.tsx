import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/common/GlassCard';
import { ScanAnimation } from '../components/common/ScanAnimation';
import { ThreatResult } from '../components/scanner/ThreatResult';
import { urlScanner } from '../services/urlScanner';
import { smsService } from '../services/smsService';
import { securityAnalyzer } from '../services/securityAnalyzer';
import { useStore } from '../store/useStore';

export const ScannerScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { addScanResult } = useStore();
  
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSender, setSmsSender] = useState('');
  const [smsResult, setSmsResult] = useState<any>(null);

  const handleURLScan = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await urlScanner.scanURL(url);
      setScanResult(result);
      addScanResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan URL');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSMSScan = async () => {
    if (!smsMessage.trim()) {
      Alert.alert('Error', 'Please enter an SMS message to scan');
      return;
    }

    setIsScanning(true);
    setSmsResult(null);

    try {
      const result = await smsService.scanMessage(smsMessage, smsSender);
      setSmsResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan SMS');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content) {
        setUrl(content);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const handleClipboardScan = async () => {
    setIsScanning(true);
    try {
      const result = await securityAnalyzer.analyzeClipboard();
      setScanResult({
        url: 'Clipboard Content',
        isThreat: result.threats.length > 0,
        riskScore: Math.max(...result.threats.map((t: any) => t.riskScore)),
        threatType: 'Clipboard Analysis',
        indicators: result.threats.flatMap((t: any) => t.indicators),
        recommendation: result.recommendation,
      });
      addScanResult(scanResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze clipboard');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#0a0e21'] : ['#e0e7ff', '#ffffff']}
        style={styles.gradient}
      >
        <Text style={[styles.title, { color: colors.text }]}>Security Scanner</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Scan URLs, SMS messages, and detect threats
        </Text>

        {/* URL Scanner Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              URL Scanner
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter URL to scan..."
              placeholderTextColor={colors.subtext}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                onPress={handlePasteFromClipboard}
                style={[styles.iconBtn, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons name="clipboard" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClipboardScan}
                style={[styles.iconBtn, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons name="scan-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleURLScan}
            disabled={isScanning}
            style={[styles.scanButton, { opacity: isScanning ? 0.5 : 1 }]}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.scanButtonGradient}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Scan URL</Text>
            </LinearGradient>
          </TouchableOpacity>

          {isScanning && <ScanAnimation isScanning={isScanning} />}
          {scanResult && <ThreatResult result={scanResult} />}
        </GlassCard>

        {/* SMS Scanner Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={24} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              SMS Scanner
            </Text>
          </View>

          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Paste SMS message to scan..."
            placeholderTextColor={colors.subtext}
            value={smsMessage}
            onChangeText={setSmsMessage}
            multiline
            numberOfLines={4}
          />

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Sender phone number (optional)"
            placeholderTextColor={colors.subtext}
            value={smsSender}
            onChangeText={setSmsSender}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            onPress={handleSMSScan}
            disabled={isScanning}
            style={[styles.scanButton, { opacity: isScanning ? 0.5 : 1 }]}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.scanButtonGradient}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Analyze SMS</Text>
            </LinearGradient>
          </TouchableOpacity>

          {smsResult && (
            <View style={styles.smsResultContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: smsResult.isThreat ? colors.danger : colors.success }
              ]}>
                <Ionicons
                  name={smsResult.isThreat ? 'warning' : 'checkmark-circle'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.statusText}>
                  {smsResult.isThreat ? 'Threat Detected' : 'Message Safe'}
                </Text>
              </View>
              
              {smsResult.isThreat && (
                <View style={styles.threatDetails}>
                  <Text style={[styles.riskScore, { color: colors.danger }]}>
                    Risk Score: {smsResult.riskScore}/100
                  </Text>
                  {smsResult.threatDetails.map((detail: any, index: number) => (
                    <View key={index} style={styles.threatItem}>
                      <Ionicons name="alert-circle" size={16} color={colors.danger} />
                      <Text style={[styles.threatText, { color: colors.text }]}>
                        {detail.threatType}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
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
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
    marginBottom: 10,
  },
  inputActions: {
    flexDirection: 'column',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smsResultContainer: {
    marginTop: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    marginBottom: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  threatDetails: {
    gap: 10,
  },
  riskScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threatText: {
    fontSize: 14,
  },
});
