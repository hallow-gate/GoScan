import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const requestSMSPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'SMS Access Required',
        message: 'ShieldNet needs SMS access to detect phishing and scam messages in real-time.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      // Also request READ_SMS for comprehensive monitoring
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'Read SMS Messages',
          message: 'Allow ShieldNet to read SMS messages to scan for threats.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      
      return readGranted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  } catch (err) {
    console.error('Error requesting SMS permission:', err);
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'ShieldNet needs to send you notifications about security threats.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }
  return true;
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access',
          message: 'Allow ShieldNet to access location for weather-based security features.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (err) {
    console.error('Error requesting location permission:', err);
    return false;
  }
};

export const checkAllPermissions = async () => {
  const permissions = {
    sms: await requestSMSPermission(),
    notification: await requestNotificationPermission(),
    location: await requestLocationPermission(),
  };

  if (!permissions.sms) {
    Alert.alert(
      'Limited Protection',
      'SMS monitoring is disabled. Enable it in Settings for complete protection.',
      [{ text: 'OK' }]
    );
  }

  return permissions;
};
