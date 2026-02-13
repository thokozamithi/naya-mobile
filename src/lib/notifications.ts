import { supabase } from '@/services/supabase';

interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendPushNotification = async (options: NotificationOptions) => {
  // TODO: Implement push notification logic using Expo notifications
  console.log('Sending notification:', options);
};

export const scheduleNotification = async (
  delayMs: number,
  options: NotificationOptions
) => {
  // TODO: Schedule notification for later
  console.log('Scheduling notification in', delayMs, 'ms:', options);
};

export const cancelNotification = async (notificationId: string) => {
  // TODO: Cancel scheduled notification
  console.log('Canceling notification:', notificationId);
};
