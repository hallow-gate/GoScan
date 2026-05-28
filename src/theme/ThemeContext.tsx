import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import env from '../utils/env';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    subtext: string;
    cardBg: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
    accent: string;
    gradient: string[];
  };
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(
    (env.DEFAULT_THEME as Theme) || 'dark'
  );

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(env.THEME_STORAGE_KEY || 'app_theme');
      if (saved) {
        setThemeState(saved as Theme);
      } else if (systemColorScheme) {
        setThemeState(systemColorScheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(env.THEME_STORAGE_KEY || 'app_theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0a0e21' : '#f0f2f5',
    surface: isDark ? '#1a1a2e' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a2e',
    subtext: isDark ? '#a0a0b0' : '#666666',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: isDark ? '#e94560' : '#3b82f6',
    gradient: isDark 
      ? ['#1a1a2e', '#16213e', '#0f3460'] 
      : ['#e0e7ff', '#f0f4ff', '#ffffff'],
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
