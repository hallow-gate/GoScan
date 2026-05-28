import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/common/GlassCard';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { weatherService } from '../services/weatherService';

const { width } = Dimensions.get('window');

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  rainChance: number;
  hourly: Array<{
    time: string;
    temp: number;
    condition: string;
  }>;
  alerts: string[];
}

export const WeatherScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const data = await weatherService.getCurrentWeather();
      if (data) {
        setWeather(data);
        setSuggestions(weatherService.getWeatherSuggestions(data));
      }
    } catch (error) {
      console.error('Error loading weather:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  };

  const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
    switch (condition.toLowerCase()) {
      case 'clear': return 'sunny';
      case 'clouds': return 'cloudy';
      case 'rain': return 'rainy';
      case 'drizzle': return 'rainy-outline';
      case 'thunderstorm': return 'thunderstorm';
      case 'snow': return 'snow';
      case 'mist': return 'cloudy-night';
      case 'fog': return 'cloudy-night';
      default: return 'partly-sunny';
    }
  };

  if (!weather) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-download" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading weather data...</Text>
      </View>
    );
  }

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
        <Text style={[styles.title, { color: colors.text }]}>Weather</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Current conditions and security insights
        </Text>

        {/* Current Weather Card */}
        <GlassCard style={styles.currentWeather}>
          <View style={styles.weatherMain}>
            <View>
              <Text style={[styles.temperature, { color: colors.text }]}>
                {weather.temperature}°C
              </Text>
              <Text style={[styles.condition, { color: colors.subtext }]}>
                {weather.condition}
              </Text>
            </View>
            <Ionicons
              name={getWeatherIcon(weather.condition)}
              size={72}
              color={colors.primary}
            />
          </View>
        </GlassCard>

        {/* Weather Details */}
        <View style={styles.detailsGrid}>
          <GlassCard style={styles.detailCard}>
            <Ionicons name="water" size={24} color={colors.primary} />
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {weather.humidity}%
            </Text>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Humidity</Text>
          </GlassCard>

          <GlassCard style={styles.detailCard}>
            <Ionicons name="speedometer" size={24} color={colors.warning} />
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {weather.windSpeed}
            </Text>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Wind km/h</Text>
          </GlassCard>

          <GlassCard style={styles.detailCard}>
            <Ionicons name="sunny" size={24} color={colors.danger} />
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {weather.uvIndex}
            </Text>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>UV Index</Text>
          </GlassCard>

          <GlassCard style={styles.detailCard}>
            <Ionicons name="umbrella" size={24} color={colors.primary} />
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {weather.rainChance}%
            </Text>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Rain Chance</Text>
          </GlassCard>
        </View>

        {/* Hourly Forecast */}
        <GlassCard style={styles.hourlyCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hourly Forecast
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weather.hourly.map((hour, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={[styles.hourlyTime, { color: colors.subtext }]}>
                  {hour.time}
                </Text>
                <Ionicons
                  name={getWeatherIcon(hour.condition)}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.hourlyTemp, { color: colors.text }]}>
                  {hour.temp}°
                </Text>
              </View>
            ))}
          </ScrollView>
        </GlassCard>

        {/* Weather Alerts */}
        {weather.alerts.length > 0 && (
          <GlassCard style={[styles.alertCard, { borderColor: colors.warning }]}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color={colors.warning} />
              <Text style={[styles.alertTitle, { color: colors.warning }]}>
                Weather Alerts
              </Text>
            </View>
            {weather.alerts.map((alert, index) => (
              <Text key={index} style={[styles.alertText, { color: colors.text }]}>
                {alert}
              </Text>
            ))}
          </GlassCard>
        )}

        {/* Security Suggestions */}
        <GlassCard style={styles.suggestionsCard}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Weather-Based Security Tips
            </Text>
          </View>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} />
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Hydration Reminder */}
        <GlassCard style={styles.hydrationCard}>
          <View style={styles.hydrationHeader}>
            <Ionicons name="water" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hydration Tracker
            </Text>
          </View>
          <Text style={[styles.hydrationText, { color: colors.subtext }]}>
            {weather.temperature > 30 
              ? 'Drink at least 3-4 liters of water today' 
              : weather.temperature > 25 
              ? 'Stay hydrated with 2-3 liters of water' 
              : 'Maintain regular water intake'}
          </Text>
          <View style={styles.waterGlasses}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waterGlass,
                  {
                    backgroundColor: i < 4 
                      ? colors.primary + '40' 
                      : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={i < 4 ? 'water' : 'water-outline'}
                  size={20}
                  color={i < 4 ? colors.primary : colors.subtext}
                />
              </View>
            ))}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
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
  currentWeather: {
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  temperature: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  condition: {
    fontSize: 18,
    marginTop: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailCard: {
    width: (width - 60) / 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  hourlyCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 24,
    gap: 8,
  },
  hourlyTime: {
    fontSize: 14,
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertCard: {
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  suggestionsCard: {
    padding: 20,
    marginBottom: 20,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  hydrationCard: {
    padding: 20,
    marginBottom: 20,
  },
  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  hydrationText: {
    fontSize: 14,
    marginBottom: 20,
  },
  waterGlasses: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterGlass: {
    width: 36,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
