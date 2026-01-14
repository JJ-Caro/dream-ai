import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logError, logWarning, logDebug } from '@/lib/errorLogger';

const REMINDER_STORAGE_KEY = '@dream_reminder_time';
const NOTIFICATION_ID_KEY = '@dream_notification_id';
const CHANNEL_ID = 'dream-reminders';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Set up notification channel for Android
 */
async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Dream Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4FD1C5',
      sound: 'default',
      enableVibrate: true,
      showBadge: false,
    });
  }
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  return true;
}

/**
 * Schedule a daily dream reminder notification
 */
export async function scheduleDreamReminder(hour: number, minute: number): Promise<string | null> {
  try {
    // Cancel any existing reminder first
    await cancelDreamReminder();

    // Set up Android channel
    await setupNotificationChannel();

    // Schedule new daily notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to log your dream ✨",
        body: "Capture your dream before it fades away",
        sound: true,
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    logDebug('scheduleDreamReminder', `Scheduled notification for ${hour}:${minute}`, { notificationId });

    // Save settings to AsyncStorage
    const settings: ReminderSettings = { enabled: true, hour, minute };
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);

    return notificationId;
  } catch (error) {
    logError('scheduleDreamReminder', error);
    return null;
  }
}

/**
 * Cancel the existing dream reminder
 */
export async function cancelDreamReminder(): Promise<void> {
  try {
    const notificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    // Clear stored settings
    await AsyncStorage.removeItem(REMINDER_STORAGE_KEY);
    await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
  } catch (error) {
    logError('cancelDreamReminder', error);
  }
}

/**
 * Get the current reminder settings
 */
export async function getReminderSettings(): Promise<ReminderSettings | null> {
  try {
    const settingsJson = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson) as ReminderSettings;
    }
    return null;
  } catch (error) {
    logError('getReminderSettings', error);
    return null;
  }
}

/**
 * Re-register the notification on app launch if one was previously scheduled
 * This is needed because notifications can be cleared when the app is updated
 */
export async function reregisterReminderIfNeeded(): Promise<void> {
  try {
    // Always set up the Android channel on app start
    await setupNotificationChannel();

    const settings = await getReminderSettings();

    if (settings && settings.enabled) {
      // Check if the notification is still scheduled
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const notificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);

      const isStillScheduled = scheduled.some(n => n.identifier === notificationId);

      if (!isStillScheduled) {
        logDebug('reregisterReminderIfNeeded', 'Re-scheduling notification that was cleared');
        // Re-schedule the notification
        await scheduleDreamReminder(settings.hour, settings.minute);
      } else {
        logDebug('reregisterReminderIfNeeded', 'Notification is still scheduled', { notificationId });
      }
    }
  } catch (error) {
    logError('reregisterReminderIfNeeded', error);
  }
}

/**
 * Format time for display (e.g., "7:00 AM")
 */
export function formatReminderTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
