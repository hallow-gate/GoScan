import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from '../common/GlassCard';
import { smsService } from '../../services/smsService';

export const SMSMonitor: React.FC = () => {
  const { colors } = useTheme();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isMonitoring) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isMonitoring]);

  const toggleMonitoring = async (value: boolean) => {
    setIsMonitoring(value);
    if (value) {
      await smsService.initialize();
    }
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="phone-portrait" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            SMS Protection
          </Text>
        </View>
        <Switch
          value={isMonitoring}
          onValueChange={toggleMonitoring}
          trackColor={{ false: '#767577', true: colors.success }}
          thumbColor={isMonitoring ? '#fff' : '#f4f3f4'}
        />
      </View>

      {isMonitoring && (
        <View style={styles.statusContainer}>
          <Animated.View
            style={[
              styles.statusDot,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={[styles.innerDot, { backgroundColor: colors.success }]} />
          </Animated.View>
          <Text style={[styles.statusText, { color: colors.success }]}>
            Monitoring Active
          </Text>
        </View>
      )}

      <Text style={[styles.description, { color: colors.subtext }]}>
        {isMonitoring
          ? 'ShieldNet is scanning incoming SMS messages for phishing and scam attempts.'
          : 'Enable SMS monitoring to protect against phishing and scam messages.'}
      </Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
