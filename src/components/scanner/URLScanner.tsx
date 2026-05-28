import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { urlScanner } from '../../services/urlScanner';
import { useStore } from '../../store/useStore';

interface URLScannerProps {
  onScanComplete?: (result: any) => void;
}

export const URLScanner: React.FC<URLScannerProps> = ({ onScanComplete }) => {
  const { colors } = useTheme();
  const { addScanResult } = useStore();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleScan = async () => {
    if (!url.trim()) {
      alert('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    try {
      // Normalize URL
      let scanUrl = url.trim();
      if (!scanUrl.startsWith('http://') && !scanUrl.startsWith('https://')) {
        scanUrl = 'https://' + scanUrl;
      }

      const result = await urlScanner.scanURL(scanUrl);
      setLastResult(result);
      addScanResult(result);
      onScanComplete?.(result);
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan URL. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return '#ef4444';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#eab308';
    return '#10b981';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return 'Dangerous';
    if (score >= 50) return 'Suspicious';
    if (score >= 25) return 'Caution';
    return 'Safe';
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
          <Ionicons name="link" size={20} color={colors.subtext} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter URL to scan..."
            placeholderTextColor={colors.subtext}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isScanning}
          />
          {url.length > 0 && (
            <TouchableOpacity onPress={() => setUrl('')}>
              <Ionicons name="close-circle" size={20} color={colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
        onPress={handleScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color="#fff" style={styles.scanningIndicator} />
        ) : (
          <Ionicons name="scan" size={20} color="#fff" />
        )}
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Scanning...' : 'Scan URL'}
        </Text>
      </TouchableOpacity>

      {lastResult && (
        <View style={[styles.resultContainer, { borderColor: getRiskColor(lastResult.riskScore) }]}>
          <View style={styles.resultHeader}>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(lastResult.riskScore) + '20' }]}>
              <Ionicons
                name={lastResult.isThreat ? 'warning' : 'checkmark-circle'}
                size={20}
                color={getRiskColor(lastResult.riskScore)}
              />
              <Text style={[styles.riskLabel, { color: getRiskColor(lastResult.riskScore) }]}>
                {getRiskLabel(lastResult.riskScore)}
              </Text>
            </View>
            <Text style={[styles.riskScore, { color: colors.text }]}>
              Risk Score: {lastResult.riskScore}/100
            </Text>
          </View>

          <View style={styles.resultDetails}>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>URL</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
              {lastResult.url}
            </Text>

            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Threat Type</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {lastResult.threatType}
            </Text>

            {lastResult.indicators.length > 0 && (
              <>
                <Text style={[styles.detailLabel, { color: colors.subtext }]}>Indicators</Text>
                {lastResult.indicators.map((indicator: string, index: number) => (
                  <View key={index} style={styles.indicatorItem}>
                    <View style={[styles.indicatorDot, { backgroundColor: getRiskColor(lastResult.riskScore) }]} />
                    <Text style={[styles.indicatorText, { color: colors.text }]}>{indicator}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={[styles.recommendationBox, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="bulb" size={16} color={colors.primary} />
              <Text style={[styles.recommendationText, { color: colors.text }]}>
                {lastResult.recommendation}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  scanningIndicator: {
    marginRight: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultDetails: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  indicatorText: {
    fontSize: 13,
    flex: 1,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  recommendationText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
