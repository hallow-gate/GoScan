import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { GlassCard } from '../components/common/GlassCard';
import { SecurityShield } from '../components/common/SecurityShield';
import { ThreatRadar } from '../components/common/ThreatRadar';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { threatDatabase } from '../services/threatDatabase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { securityScore, setSecurityScore } = useStore();
  const [stats, setStats] = useState({
    totalThreats: 0,
    todayThreats: 0,
    blockedCount: 0
  });
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadStats();
    startPulseAnimation();
  }, []);

  const loadStats = async () => {
    const threatStats = await threatDatabase.getThreatStats();
    setStats({
      totalThreats: threatStats.totalThreats,
      todayThreats: threatStats.todayThreats,
      blockedCount: threatStats.maliciousDomains
    });
    setSecurityScore(calculateSecurityScore(threatStats));
  };

  const calculateSecurityScore = (threatStats: any): number => {
    let score = 100;
    if (threatStats.todayThreats > 0) score -= 10;
    if (threatStats.maliciousDomains > 10) score -= 5;
    return Math.max(score, 60);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const isDark = theme === 'dark';
  const colors = {
    background: isDark ? '#0a0e21' : '#f0f2f5',
    text: isDark ? '#ffffff' : '#1a1a2e',
    subtext: isDark ? '#a0a0b0' : '#666666',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
    gradient: isDark 
      ? ['#1a1a2e', '#16213e', '#0f3460'] 
      : ['#e0e7ff', '#f0f4ff', '#ffffff'],
    accent: isDark ? '#e94560' : '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={colors.gradient as [string, string, string]}
        style={styles.gradientBg}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              ShieldNet Secure
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              {stats.todayThreats > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{stats.todayThreats}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Shield */}
        <View style={styles.shieldContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <SecurityShield score={securityScore} />
          </Animated.View>
          <Text style={[styles.scoreText, { color: colors.text }]}>
            {securityScore}%
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.subtext }]}>
            Protection Active
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.blockedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              Blocked
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="warning" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.todayThreats}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              Today
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="scan" size={24} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.totalThreats}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              Total
            </Text>
          </GlassCard>
        </View>

        {/* Live Threat Radar */}
        <GlassCard style={styles.radarCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Live Threat Radar
          </Text>
          <ThreatRadar />
          <View style={styles.radarInfo}>
            <View style={styles.radarItem}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.radarText, { color: colors.subtext }]}>Safe</Text>
            </View>
            <View style={styles.radarItem}>
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.radarText, { color: colors.subtext }]}>Suspicious</Text>
            </View>
            <View style={styles.radarItem}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.radarText, { color: colors.subtext }]}>Dangerous</Text>
            </View>
          </View>
        </GlassCard>

        {/* Weather Widget */}
        <WeatherWidget />

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.actionGradient}
            >
              <Ionicons name="scan-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Quick Scan</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.actionGradient}
            >
              <Ionicons name="shield-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Secure Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.actionGradient}
            >
              <Ionicons name="analytics-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <GlassCard style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={24} color={colors.warning} />
            <Text style={[styles.tipTitle, { color: colors.text }]}>
              Security Tip
            </Text>
          </View>
          <Text style={[styles.tipText, { color: colors.subtext }]}>
            Never share your OTP or banking passwords with anyone. 
            Banks will never ask for these details via SMS or phone calls.
          </Text>
        </GlassCard>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    minHeight: '100%',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shieldContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 10,
  },
  scoreLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 3,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  radarCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  radarInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 20,
  },
  radarItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  radarText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  tipCard: {
    padding: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
