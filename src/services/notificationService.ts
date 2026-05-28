import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
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
      const stored = await AsyncStorage.getItem('settings');
      const settings = stored ? JSON.parse(stored) : {};
      
      if (settings.notificationsEnabled === false) return;

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
