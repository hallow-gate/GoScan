import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/common/GlassCard';
import { useStore } from '../store/useStore';

export const SettingsScreen: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const isDark = theme === 'dark';
  const {
    securityScore,
    protectionEnabled,
    toggleProtection,
    notificationsEnabled,
    toggleNotifications,
  } = useStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState('high');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setBiometricEnabled(parsed.biometricEnabled || false);
        setAutoScanEnabled(parsed.autoScanEnabled !== false);
        setSensitivity(parsed.sensitivity || 'high');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      const current = settings ? JSON.parse(settings) : {};
      current[key] = value;
      await AsyncStorage.setItem('settings', JSON.stringify(current));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('scan_history');
            await AsyncStorage.removeItem('threat_messages');
            Alert.alert('Success', 'History cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#0a0e21'] : ['#e0e7ff', '#ffffff']}
        style={styles.gradient}
      >
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Customize your security experience
        </Text>

        {/* Appearance */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={22} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
        </GlassCard>

        {/* Security */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Security
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield" size={22} color={colors.success} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Real-time Protection
              </Text>
            </View>
            <Switch
              value={protectionEnabled}
              onValueChange={() => {
                toggleProtection();
                saveSettings('protectionEnabled', !protectionEnabled);
              }}
              trackColor={{ false: '#767577', true: '#10b981' }}
              thumbColor={protectionEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="finger-print" size={22} color={colors.warning} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Biometric Lock
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => {
                setBiometricEnabled(value);
                saveSettings('biometricEnabled', value);
              }}
              trackColor={{ false: '#767577', true: '#f59e0b' }}
              thumbColor={biometricEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="speedometer" size={22} color={colors.accent} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Auto-scan Clipboard
              </Text>
            </View>
            <Switch
              value={autoScanEnabled}
              onValueChange={(value) => {
                setAutoScanEnabled(value);
                saveSettings('autoScanEnabled', value);
              }}
              trackColor={{ false: '#767577', true: '#e94560' }}
              thumbColor={autoScanEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </GlassCard>

        {/* Notifications */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Notifications
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={22} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Push Notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={() => {
                toggleNotifications();
                saveSettings('notificationsEnabled', !notificationsEnabled);
              }}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="options" size={22} color={colors.subtext} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Sensitivity Level
              </Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={[styles.valueText, { color: colors.primary }]}>
                {sensitivity.toUpperCase()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Privacy & Data */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacy & Data
          </Text>

          <TouchableOpacity style={styles.settingRow} onPress={handleClearHistory}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash" size={22} color={colors.danger} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Clear Scan History
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={22} color={colors.subtext} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </GlassCard>

        {/* App Info */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Version
            </Text>
            <Text style={[styles.valueText, { color: colors.subtext }]}>
              1.0.0
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Database Version
            </Text>
            <Text style={[styles.valueText, { color: colors.subtext }]}>
              2024.1
            </Text>
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
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
