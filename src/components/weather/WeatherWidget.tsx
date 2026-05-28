import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from '../common/GlassCard';
import { weatherService } from '../../services/weatherService';
import { useNavigation } from '@react-navigation/native';

interface MiniWeather {
  temperature: number;
  condition: string;
  humidity: number;
  rainChance: number;
}

export const WeatherWidget: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [weather, setWeather] = useState<MiniWeather | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadWeather();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadWeather = async () => {
    try {
      const data = await weatherService.getCurrentWeather();
      if (data) {
        setWeather({
          temperature: data.temperature,
          condition: data.condition,
          humidity: data.humidity,
          rainChance: data.rainChance,
        });
      }
    } catch (error) {
      console.error('Error loading weather widget:', error);
    }
  };

  const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
    switch (condition.toLowerCase()) {
      case 'clear': return 'sunny';
      case 'clouds': return 'cloudy';
      case 'rain': return 'rainy';
      case 'thunderstorm': return 'thunderstorm';
      default: return 'partly-sunny';
    }
  };

  if (!weather) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity onPress={() => navigation.navigate('Weather' as never)}>
        <GlassCard style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="partly-sunny" size={20} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Weather</Text>
            <TouchableOpacity>
              <Ionicons name="refresh" size={16} color={colors.subtext} onPress={loadWeather} />
            </TouchableOpacity>
          </View>

          <View style={styles.weatherInfo}>
            <View style={styles.mainInfo}>
              <Ionicons
                name={getWeatherIcon(weather.condition)}
                size={40}
                color={colors.primary}
              />
              <Text style={[styles.temperature, { color: colors.text }]}>
                {weather.temperature}°C
              </Text>
            </View>

            <View style={styles.details}>
              <View style={styles.detail}>
                <Ionicons name="water" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.subtext }]}>
                  {weather.humidity}%
                </Text>
              </View>
              <View style={styles.detail}>
                <Ionicons name="umbrella" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.subtext }]}>
                  {weather.rainChance}%
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.condition, { color: colors.subtext }]}>
            {weather.condition}
          </Text>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  weatherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  details: {
    gap: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  condition: {
    fontSize: 14,
    marginTop: 8,
  },
});
