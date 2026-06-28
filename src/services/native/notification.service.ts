/**
 * Notification Service
 * Wrapper for @notifee/react-native
 */

// import notifee, {AndroidImportance, EventType} from '@notifee/react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      // TODO: Uncomment when @notifee/react-native is installed
      // const settings = await notifee.requestPermission();
      // return settings.authorizationStatus >= 1;

      // Mock response for now
      return true;
    } catch (error) {
      console.error('Notification permission request error:', error);
      return false;
    }
  }

  /**
   * Display local notification
   */
  async displayNotification(data: NotificationData): Promise<void> {
    try {
      // TODO: Uncomment when @notifee/react-native is installed
      // const channelId = await notifee.createChannel({
      //   id: 'default',
      //   name: 'Default Channel',
      //   importance: AndroidImportance.HIGH,
      // });
      //
      // await notifee.displayNotification({
      //   title: data.title,
      //   body: data.body,
      //   data: data.data,
      //   android: {
      //     channelId,
      //     importance: AndroidImportance.HIGH,
      //   },
      // });

      console.log('Display notification (mock):', data);
    } catch (error) {
      console.error('Display notification error:', error);
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(
    data: NotificationData,
    trigger: {type: 'timestamp'; timestamp: number},
  ): Promise<void> {
    try {
      // TODO: Uncomment when @notifee/react-native is installed
      // const channelId = await notifee.createChannel({
      //   id: 'default',
      //   name: 'Default Channel',
      //   importance: AndroidImportance.HIGH,
      // });
      //
      // await notifee.createTriggerNotification(
      //   {
      //     title: data.title,
      //     body: data.body,
      //     data: data.data,
      //     android: {
      //       channelId,
      //     },
      //   },
      //   trigger,
      // );

      console.log('Schedule notification (mock):', data, trigger);
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      // TODO: Uncomment when @notifee/react-native is installed
      // await notifee.cancelAllNotifications();

      console.log('Cancel all notifications (mock)');
    } catch (error) {
      console.error('Cancel notifications error:', error);
    }
  }

  /**
   * Setup prayer time notifications
   */
  async setupPrayerNotifications(prayerTimes: Array<{name: string; time: string}>): Promise<void> {
    try {
      // Cancel existing prayer notifications
      await this.cancelAllNotifications();

      // Schedule notifications for each prayer time
      for (const prayer of prayerTimes) {
        const [hours, minutes] = prayer.time.split(':');
        const timestamp = new Date();
        timestamp.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        await this.scheduleNotification(
          {
            title: `Prayer Time: ${prayer.name}`,
            body: `It's time for ${prayer.name} prayer`,
            data: {type: 'prayer', prayerName: prayer.name},
          },
          {
            type: 'timestamp',
            timestamp: timestamp.getTime(),
          },
        );
      }
    } catch (error) {
      console.error('Setup prayer notifications error:', error);
    }
  }
}

export default new NotificationService();
