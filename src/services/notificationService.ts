// Web-compatible Notification Service
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only import expo-notifications on native platforms
let Notifications: any = null;
let Device: any = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (e) {
    console.log('Native notification modules not available');
  }
}

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  async initialize() {
    if (Platform.OS === 'web') {
      // Web notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Web notification permission:', permission);
      }
      return;
    }

    // Native notifications (Android/iOS)
    if (Device && Device.isDevice) {
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

    if (Platform.OS === 'android' && Notifications) {
      Notifications.setNotificationChannelAsync('threats', {
        name: 'Security Threats',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      Notifications.setNotificationChannelAsync('alerts', {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#3b82f6',
      });
    }

    if (Notifications) {
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    }
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
      const stored = await AsyncStorage.getItem('settings');
      const settings = stored ? JSON.parse(stored) : {};
      
      if (settings.notificationsEnabled === false) return;

      if (Platform.OS === 'web') {
        // Web notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.png' });
        }
        return;
      }

      // Native notification
      if (Notifications) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: category,
            ...(Platform.OS === 'android' && {
              channelId: category,
              color: '#3b82f6',
            }),
          },
          trigger: null,
        });
      }
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

  cleanup() {
    if (this.notificationListener && Notifications) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener && Notifications) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = new NotificationService();
