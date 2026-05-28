import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/store/AppContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { notificationService } from './src/services/notificationService';
import { smsService } from './src/services/smsService';

// Only import SplashScreen on native platforms
let SplashScreen: any = null;
if (Platform.OS !== 'web') {
  try {
    SplashScreen = require('expo-splash-screen');
  } catch (e) {
    console.log('SplashScreen not available');
  }
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent splash screen from auto-hiding on native
        if (SplashScreen) {
          await SplashScreen.preventAutoHideAsync();
        }

        // Initialize services
        await notificationService.initialize();
        
        // Only initialize SMS on native platforms
        if (Platform.OS !== 'web') {
          await smsService.initialize();
        }
        
        // Handle app state changes
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
          subscription.remove();
        };
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && Platform.OS !== 'web') {
      smsService.startMonitoring();
    } else if (nextAppState === 'background' && Platform.OS !== 'web') {
      smsService.continueBackgroundMonitoring();
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen on native
      if (SplashScreen) {
        await SplashScreen.hideAsync();
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
            </NavigationContainer>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
