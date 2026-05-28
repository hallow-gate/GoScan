import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { getRiskColor, getRiskLabel } from '../../utils/helpers';

interface ThreatResultProps {
  result: {
    url: string;
    isThreat: boolean;
    riskScore: number;
    threatType: string;
    indicators: string[];
    recommendation: string;
  };
}

export const ThreatResult: React.FC<ThreatResultProps> = ({ result }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const riskColor = getRiskColor(result.riskScore);
  const riskLabel = getRiskLabel(result.riskScore);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: result.isThreat ? riskColor + '15' : colors.success + '15',
          borderColor: result.isThreat ? riskColor + '30' : colors.success + '30',
        },
      ]}
    >
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={[styles.statusIcon, { backgroundColor: result.isThreat ? riskColor + '30' : colors.success + '30' }]}>
          <Ionicons
            name={result.isThreat ? 'warning' : 'shield-checkmark'}
            size={28}
            color={result.isThreat ? riskColor : colors.success}
          />
        </View>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: result.isThreat ? riskColor : colors.success }]}>
            {result.isThreat ? 'Threat Detected' : 'Safe'}
          </Text>
          <Text style={[styles.statusSubtitle, { color: colors.subtext }]}>
            {riskLabel} Risk Level
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.scoreText, { color: riskColor }]}>
            {result.riskScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: riskColor }]}>/100</Text>
        </View>
      </View>

      {/* URL Display */}
      <View style={styles.urlContainer}>
        <Text style={[styles.urlLabel, { color: colors.subtext }]}>Scanned URL:</Text>
        <Text style={[styles.urlText, { color: colors.text }]} numberOfLines={2}>
          {result.url}
        </Text>
      </View>

      {/* Threat Type */}
      <View style={styles.threatTypeContainer}>
        <View style={[styles.threatTypeBadge, { backgroundColor: riskColor + '20' }]}>
          <Ionicons name="alert-circle" size={16} color={riskColor} />
          <Text style={[styles.threatTypeText, { color: riskColor }]}>
            {result.threatType}
          </Text>
        </View>
      </View>

      {/* Indicators */}
      {result.indicators.length > 0 && (
        <View style={styles.indicatorsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Suspicious Indicators
          </Text>
          {result.indicators.map((indicator, index) => (
            <View key={index} style={styles.indicatorItem}>
              <View style={[styles.indicatorDot, { backgroundColor: riskColor }]} />
              <Text style={[styles.indicatorText, { color: colors.subtext }]}>
                {indicator}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendation */}
      <View style={[styles.recommendationContainer, { backgroundColor: colors.primary + '15' }]}>
        <View style={styles.recommendationHeader}>
          <Ionicons name="bulb" size={18} color={colors.primary} />
          <Text style={[styles.recommendationTitle, { color: colors.primary }]}>
            Recommendation
          </Text>
        </View>
        <Text style={[styles.recommendationText, { color: colors.text }]}>
          {result.recommendation}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <View style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}>
          <Ionicons name="shield" size={18} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Block</Text>
        </View>
        <View style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="flag" size={18} color={colors.warning} />
          <Text style={[styles.actionText, { color: colors.warning }]}>Report</Text>
        </View>
        <View style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="share" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scoreBadge: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    marginTop: -4,
  },
  urlContainer: {
    marginBottom: 16,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  urlText: {
    fontSize: 14,
    lineHeight: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  threatTypeContainer: {
    marginBottom: 16,
  },
  threatTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  threatTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  indicatorsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 8,
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
    lineHeight: 18,
  },
  recommendationContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
