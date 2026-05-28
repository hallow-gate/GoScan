import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/common/GlassCard';
import { formatTimestamp, getRiskColor, getRiskLabel } from '../utils/helpers';

interface Alert {
  id: string;
  type: string;
  severity: string;
  source: string;
  message: string;
  riskScore: number;
  threatType: string;
  indicators: string[];
  recommendation: string;
  timestamp: string;
  isRead: boolean;
}

export const AlertsScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [selectedFilter, alerts]);

  const loadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem('threat_messages');
      const scanHistory = await AsyncStorage.getItem('scan_history');
      
      const threatMessages = stored ? JSON.parse(stored) : [];
      const scans = scanHistory ? JSON.parse(scanHistory) : [];
      
      // Combine and format alerts
      const allAlerts: Alert[] = [
        ...threatMessages.map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          type: 'sms',
          severity: msg.riskScore > 70 ? 'high' : msg.riskScore > 40 ? 'medium' : 'low',
          source: msg.sender || 'Unknown',
          message: msg.message,
          riskScore: msg.riskScore,
          threatType: msg.threats?.[0]?.threatType || 'Unknown',
          indicators: msg.threats?.flatMap((t: any) => t.indicators) || [],
          recommendation: 'Do not click links or respond to this message',
          timestamp: msg.timestamp,
          isRead: false,
        })),
        ...scans.map((scan: any) => ({
          id: scan.id || Date.now().toString(),
          type: 'url',
          severity: scan.riskScore > 70 ? 'high' : scan.riskScore > 40 ? 'medium' : 'low',
          source: scan.url,
          message: `URL scan detected ${scan.threatType}`,
          riskScore: scan.riskScore,
          threatType: scan.threatType,
          indicators: scan.indicators || [],
          recommendation: scan.recommendation,
          timestamp: scan.timestamp,
          isRead: false,
        })),
      ];

      // Sort by timestamp, newest first
      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAlerts(allAlerts);
      updateStats(allAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const updateStats = (alertList: Alert[]) => {
    setStats({
      total: alertList.length,
      high: alertList.filter(a => a.severity === 'high').length,
      medium: alertList.filter(a => a.severity === 'medium').length,
      low: alertList.filter(a => a.severity === 'low').length,
    });
  };

  const filterAlerts = () => {
    if (selectedFilter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(a => a.severity === selectedFilter));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isRead: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    AsyncStorage.removeItem('threat_messages');
    AsyncStorage.removeItem('scan_history');
    setAlerts([]);
    setFilteredAlerts([]);
    updateStats([]);
  };

  const filters = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'high', label: 'High', icon: 'warning' },
    { id: 'medium', label: 'Medium', icon: 'alert' },
    { id: 'low', label: 'Low', icon: 'information-circle' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#0a0e21'] : ['#e0e7ff', '#ffffff']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Security Alerts</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              {stats.total} threats detected
            </Text>
          </View>
          {alerts.length > 0 && (
            <TouchableOpacity onPress={clearAllAlerts} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[styles.clearText, { color: colors.danger }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { borderLeftColor: colors.danger, borderLeftWidth: 3 }]}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.high}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>High Risk</Text>
          </GlassCard>
          
          <GlassCard style={[styles.statCard, { borderLeftColor: colors.warning, borderLeftWidth: 3 }]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.medium}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Medium</Text>
          </GlassCard>
          
          <GlassCard style={[styles.statCard, { borderLeftColor: colors.success, borderLeftWidth: 3 }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.low}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Low Risk</Text>
          </GlassCard>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedFilter === filter.id 
                    ? colors.primary 
                    : colors.cardBg,
                },
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.id ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.filterText,
                  { color: selectedFilter === filter.id ? '#fff' : colors.text },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark" size={64} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Threats Detected
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
              Your device is secure. We'll alert you if any threats are found.
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              onPress={() => {
                toggleExpand(alert.id);
                markAsRead(alert.id);
              }}
            >
              <GlassCard style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertTypeContainer}>
                    <View style={[
                      styles.severityIndicator,
                      { backgroundColor: getRiskColor(alert.riskScore) }
                    ]} />
                    <View style={styles.alertInfo}>
                      <View style={styles.alertTitleRow}>
                        <Ionicons
                          name={alert.type === 'sms' ? 'chatbubble' : 'link'}
                          size={18}
                          color={colors.primary}
                        />
                        <Text style={[styles.alertType, { color: colors.text }]}>
                          {alert.threatType}
                        </Text>
                        {!alert.isRead && (
                          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <Text style={[styles.alertSource, { color: colors.subtext }]} numberOfLines={1}>
                        {alert.source}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.alertMeta}>
                    <Text style={[styles.alertTime, { color: colors.subtext }]}>
                      {formatTimestamp(alert.timestamp)}
                    </Text>
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: getRiskColor(alert.riskScore) + '20' }
                    ]}>
                      <Text style={[styles.riskText, { color: getRiskColor(alert.riskScore) }]}>
                        {getRiskLabel(alert.riskScore)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Expanded Content */}
                {expandedId === alert.id && (
                  <View style={styles.expandedContent}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    {alert.message && (
                      <View style={styles.detailSection}>
                        <Text style={[styles.detailLabel, { color: colors.subtext }]}>Message</Text>
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {alert.message}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <View style={styles.detailSection}>
                        <Text style={[styles.detailLabel, { color: colors.subtext }]}>Risk Score</Text>
                        <Text style={[styles.riskScoreValue, { color: getRiskColor(alert.riskScore) }]}>
                          {alert.riskScore}/100
                        </Text>
                      </View>
                      <View style={styles.detailSection}>
                        <Text style={[styles.detailLabel, { color: colors.subtext }]}>Severity</Text>
                        <Text style={[
                          styles.severityText,
                          { color: getRiskColor(alert.riskScore) }
                        ]}>
                          {alert.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {alert.indicators.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={[styles.detailLabel, { color: colors.subtext }]}>
                          Suspicious Indicators
                        </Text>
                        {alert.indicators.map((indicator, index) => (
                          <View key={index} style={styles.indicatorItem}>
                            <Ionicons name="alert-circle" size={14} color={colors.warning} />
                            <Text style={[styles.indicatorText, { color: colors.text }]}>
                              {indicator}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: colors.subtext }]}>
                        Recommendation
                      </Text>
                      <View style={[styles.recommendationBox, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="bulb" size={18} color={colors.primary} />
                        <Text style={[styles.recommendationText, { color: colors.text }]}>
                          {alert.recommendation}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.danger + '20' }]}>
                        <Ionicons name="shield" size={18} color={colors.danger} />
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>Block Source</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="flag" size={18} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Report</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  alertCard: {
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertTypeContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  severityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertSource: {
    fontSize: 13,
    marginTop: 4,
  },
  alertMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  alertTime: {
    fontSize: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  severityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  indicatorText: {
    fontSize: 13,
    flex: 1,
  },
  recommendationBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  recommendationText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
