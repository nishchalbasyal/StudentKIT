import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type {
  AISettingsInput,
  NotificationSettingsInput,
  PreferenceSettingsInput,
  UpdateSettingsInput,
  WorkSettingsInput,
} from "./settings.schemas.js";

type SettingsRecord = NonNullable<Awaited<ReturnType<typeof ensureSettings>>>;

function serialize(record: SettingsRecord) {
  return {
    id: record.id,
    notifications: {
      pushNotifications: record.pushNotifications,
      emailUpdates: record.emailUpdates,
      reminderCategories: {
        classes: record.notifyClasses,
        tasks: record.notifyTasks,
        work: record.notifyWork,
        groceries: record.notifyGroceries,
        cleaning: record.notifyCleaning,
        splitSettlements: record.notifySplitSettlements,
      },
    },
    preferences: {
      theme: record.theme,
      language: record.language,
      currency: record.currency,
      dateFormat: record.dateFormat,
      timeFormat: record.timeFormat,
    },
    ai: {
      aiSuggestionsEnabled: record.aiSuggestionsEnabled,
      aiProviderStatus: record.aiProviderStatus,
      aiFormSuggestionsAllowed: record.aiFormSuggestionsAllowed,
      aiSuggestionsCacheClearedAt: record.aiSuggestionsCacheClearedAt,
    },
    work: {
      workCountry: record.workCountry,
      yearlyWorkLimitDays: record.yearlyWorkLimitDays,
      defaultHourlyWage: record.defaultHourlyWage,
    },
    updatedAt: record.updatedAt,
  };
}

async function ensureSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      country: true,
      currency: true,
      hourlyWageDefault: true,
      settings: true,
    },
  });

  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

  if (user.settings) return user.settings;

  return prisma.userSettings.create({
    data: {
      userId,
      workCountry: user.country,
      currency: user.currency,
      defaultHourlyWage: user.hourlyWageDefault,
    },
  });
}

function notificationData(input: NotificationSettingsInput) {
  return {
    pushNotifications: input.pushNotifications,
    emailUpdates: input.emailUpdates,
    notifyClasses: input.reminderCategories?.classes,
    notifyTasks: input.reminderCategories?.tasks,
    notifyWork: input.reminderCategories?.work,
    notifyGroceries: input.reminderCategories?.groceries,
    notifyCleaning: input.reminderCategories?.cleaning,
    notifySplitSettlements: input.reminderCategories?.splitSettlements,
  };
}

function preferenceData(input: PreferenceSettingsInput) {
  return {
    theme: input.theme,
    language: input.language,
    currency: input.currency?.toUpperCase(),
    dateFormat: input.dateFormat,
    timeFormat: input.timeFormat,
  };
}

function aiData(input: AISettingsInput) {
  return {
    aiSuggestionsEnabled: input.aiSuggestionsEnabled,
    aiFormSuggestionsAllowed: input.aiFormSuggestionsAllowed,
    aiSuggestionsCacheClearedAt: input.clearCache ? new Date() : undefined,
  };
}

function workData(input: WorkSettingsInput) {
  return {
    workCountry: input.workCountry?.toUpperCase(),
    yearlyWorkLimitDays: input.yearlyWorkLimitDays,
    defaultHourlyWage: input.defaultHourlyWage,
  };
}

async function updateSettings(userId: string, data: Record<string, unknown>) {
  await ensureSettings(userId);
  const updated = await prisma.userSettings.update({
    where: { userId },
    data,
  });

  return serialize(updated);
}

export class SettingsService {
  static async get(userId: string) {
    return serialize(await ensureSettings(userId));
  }

  static async update(userId: string, input: UpdateSettingsInput) {
    const data = {
      ...notificationData(input),
      ...preferenceData(input),
      ...aiData(input),
      ...workData(input),
    };

    return updateSettings(userId, data);
  }

  static async updateNotifications(userId: string, input: NotificationSettingsInput) {
    return updateSettings(userId, notificationData(input));
  }

  static async updatePreferences(userId: string, input: PreferenceSettingsInput) {
    const next = await updateSettings(userId, preferenceData(input));
    if (input.currency) {
      await prisma.user.update({ where: { id: userId }, data: { currency: input.currency.toUpperCase() } });
    }
    return next;
  }

  static async updateAI(userId: string, input: AISettingsInput) {
    return updateSettings(userId, aiData(input));
  }

  static async updateWork(userId: string, input: WorkSettingsInput) {
    const next = await updateSettings(userId, workData(input));
    await prisma.user.update({
      where: { id: userId },
      data: {
        country: input.workCountry?.toUpperCase(),
        hourlyWageDefault: input.defaultHourlyWage,
      },
    });
    return next;
  }
}
