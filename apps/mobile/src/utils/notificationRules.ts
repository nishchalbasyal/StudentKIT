import type { Reminder } from "../types/reminder.types";

export type NotificationCategorySettings = Partial<Record<Reminder["type"], boolean>>;

export type NotificationRuleSettings = {
  quietHoursStart?: number;
  quietHoursEnd?: number;
  maxDailyReminders?: number;
  sentTodayCount?: number;
  enabledCategories?: NotificationCategorySettings;
  now?: Date;
};

function isInsideQuietHours(hour: number, start: number, end: number) {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;

  return hour >= start || hour < end;
}

export function shouldSendReminder(
  reminder: Reminder,
  settings: NotificationRuleSettings = {}
) {
  if (reminder.isCompleted) return false;

  const now = settings.now ?? new Date();
  const quietStart = settings.quietHoursStart ?? 22;
  const quietEnd = settings.quietHoursEnd ?? 7;
  const maxDailyReminders = settings.maxDailyReminders ?? 5;
  const sentTodayCount = settings.sentTodayCount ?? 0;

  if (isInsideQuietHours(now.getHours(), quietStart, quietEnd)) {
    return false;
  }

  if (sentTodayCount >= maxDailyReminders) {
    return false;
  }

  if (settings.enabledCategories?.[reminder.type] === false) {
    return false;
  }

  return true;
}
