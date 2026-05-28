import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/store/AppContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { notificationService } from './src/services/notificationService';
import { smsService } from './src/services/smsService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await notificationService.initialize();
        await smsService.initialize();
        
        // Handle app state changes for background monitoring
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
    if (nextAppState === 'active') {
      smsService.startMonitoring();
    } else if (nextAppState === 'background') {
      smsService.continueBackgroundMonitoring();
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
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
