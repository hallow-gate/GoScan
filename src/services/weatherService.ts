import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

class WeatherService {
  private readonly API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Free API key from openweathermap.org
  
  async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const response = await axios.get(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=${this.API_KEY}&units=metric`
      );

      const data = response.data;

      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temp),
        condition: data.current.weather[0].main,
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_speed * 3.6), // Convert to km/h
        uvIndex: Math.round(data.current.uvi),
        rainChance: data.hourly[0].pop * 100,
        hourly: data.hourly.slice(0, 8).map((hour: any) => ({
          time: new Date(hour.dt * 1000).getHours() + ':00',
          temp: Math.round(hour.temp),
          condition: hour.weather[0].main,
        })),
        alerts: data.alerts?.map((alert: any) => alert.description) || [],
      };

      // Cache weather data
      await AsyncStorage.setItem('weather_data', JSON.stringify({
        ...weatherData,
        timestamp: Date.now(),
      }));

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getCachedWeather();
    }
  }

  private async getCachedWeather(): Promise<WeatherData | null> {
    try {
      const cached = await AsyncStorage.getItem('weather_data');
      if (cached) {
        const data = JSON.parse(cached);
        // Use cache if less than 30 minutes old
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error getting cached weather:', error);
    }
    return null;
  }

  getWeatherSuggestions(weather: WeatherData): string[] {
    const suggestions: string[] = [];

    if (weather.temperature > 35) {
      suggestions.push('Extreme heat alert: Stay hydrated and avoid outdoor activities');
      suggestions.push('High temperature may affect device performance');
    } else if (weather.temperature > 30) {
      suggestions.push('Hot weather: Remember to drink water regularly');
    }

    if (weather.rainChance > 70) {
      suggestions.push('High chance of rain: Carry an umbrella');
    }

    if (weather.uvIndex > 8) {
      suggestions.push('Very high UV index: Use sun protection');
    }

    if (weather.windSpeed > 50) {
      suggestions.push('Strong winds: Secure outdoor items');
    }

    if (weather.humidity > 80) {
      suggestions.push('High humidity: Watch for device moisture');
    }

    return suggestions;
  }
}

export const weatherService = new WeatherService();
