import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";
import type { Reminder } from "../types/reminder.types";
import { shouldSendReminder, type NotificationRuleSettings } from "./notificationRules";

type NotificationsModule = typeof ExpoNotifications;

let notificationsModule: Promise<NotificationsModule | null> | null = null;
let didWarnExpoGoAndroid = false;

function shouldDisableNotifications() {
  return Platform.OS === "android" && isRunningInExpoGo();
}

function warnExpoGoAndroid() {
  if (!didWarnExpoGoAndroid) {
    didWarnExpoGoAndroid = true;
    console.warn(
      "Notifications are disabled in Android Expo Go because expo-notifications remote push support was removed there in SDK 53. Use a development build to test notifications."
    );
  }
}

async function getNotificationsModule() {
  if (shouldDisableNotifications()) {
    warnExpoGoAndroid();
    return null;
  }

  notificationsModule ??= import("expo-notifications")
    .then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true
        })
      });

      return Notifications;
    })
    .catch((error: unknown) => {
      console.warn("Unable to load notifications.", error);
      return null;
    });

  return notificationsModule;
}

export async function requestNotificationPermission() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminderNotification(
  reminder: Reminder,
  rules?: NotificationRuleSettings
) {
  const scheduledAt = new Date(reminder.scheduledAt);

  if (
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt <= new Date() ||
    !shouldSendReminder(reminder, rules)
  ) {
    return null;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.message ?? "Student Kit reminder",
      data: {
        reminderId: reminder.id,
        reminderType: reminder.type
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt
    }
  });
}

export async function cancelScheduledNotification(notificationId: string) {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
