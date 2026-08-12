import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get permission for notifications!');
        return false;
      }

      // 1. Detect when the app is running inside Expo Go.
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

      // 2. Skip all push notification registration and token generation in Expo Go.
      if (!isExpoGo) {
        // Register for push notifications only in Dev Builds or Production
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
          if (projectId) {
            const pushTokenData = await Notifications.getExpoPushTokenAsync({
              projectId,
            });
            console.log('Push token:', pushTokenData.data);
          }
        } catch (e) {
          // 6. Make notification initialization safe so the app never crashes
          console.log('Error getting push token:', e);
        }
      } else {
        // 7. Add comments explaining why this check exists.
        console.log('Running in Expo Go: Skipping remote push token registration as it is unsupported in SDK 53+.');
      }

      // 5. Ensure local notifications can still be used if supported.
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6B4F3A',
        });
      }

      return true;
    } catch (error) {
      console.log('Notification permission request failed:', error);
      return false;
    }
  }

  async sendLocalNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // trigger immediately
    });
  }

  async checkBudgetLimits(budgetName: string, spent: number, limit: number) {
    if (spent >= limit) {
      await this.sendLocalNotification(
        'Budget Exceeded',
        `You have exceeded your budget for ${budgetName}!`
      );
    } else if (spent >= limit * 0.9) {
      await this.sendLocalNotification(
        'Budget Nearing Limit',
        `You have spent ${((spent / limit) * 100).toFixed(0)}% of your ${budgetName} budget.`
      );
    }
  }
}

export const notificationService = new NotificationService();
