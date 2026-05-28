import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../utils/env';

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  async initialize() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    }

    if (Platform.OS === 'android') {
      // Use environment variables for channel configuration
      const vibrationPattern = env.VIBRATION_PATTERN 
        ? env.VIBRATION_PATTERN.split(',').map(Number) 
        : [0, 250, 250, 250];

      Notifications.setNotificationChannelAsync(
        env.NOTIFICATION_CHANNEL_ID || 'threats',
        {
          name: env.NOTIFICATION_CHANNEL_NAME || 'Security Threats',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern,
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        }
      );

      Notifications.setNotificationChannelAsync('alerts', {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#3b82f6',
      });
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldVibrate: true,
      }),
    });

    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      if (env.APP_DEBUG) {
        console.log('Notification received:', notification);
      }
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      if (env.APP_DEBUG) {
        console.log('Notification response:', response);
      }
    });
  }

  async showThreatNotification({
    title,
    body,
    data = {},
    category = 'threats'
  }: {
    title: string;
    body: string;
    data?: any;
    category?: string;
  }) {
    try {
      // Check if notifications are enabled in settings
      const stored = await AsyncStorage.getItem('settings');
      const settings = stored ? JSON.parse(stored) : {};
      
      if (settings.notificationsEnabled === false) return;

      const channelId = category === 'threats' 
        ? (env.NOTIFICATION_CHANNEL_ID || 'threats')
        : 'alerts';

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: category === 'threats' 
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: category,
          ...(Platform.OS === 'android' && {
            channelId,
            color: '#3b82f6',
            icon: './assets/adaptive-icon.png',
          }),
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async showUrgentAlert(title: string, body: string) {
    await this.showThreatNotification({
      title: `URGENT: ${title}`,
      body,
      category: 'threats',
    });
  }

  async scheduleReminder(title: string, body: string, seconds: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'reminder' },
        },
        trigger: {
          seconds,
          channelId: 'alerts',
        },
      });
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = new NotificationService();
