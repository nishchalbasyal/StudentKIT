import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type {
  AISettingsInput,
  NotificationSettingsInput,
  PreferenceSettingsInput,
  UpdateSettingsInput,
  WorkSettingsInput,
  ModuleSettingsInput,
} from "./settings.schemas.js";

type ModulePreferences = {
  work: boolean;
  money: boolean;
  splits: boolean;
  tasks: boolean;
  groceries: boolean;
  cleaning: boolean;
  coupons: boolean;
  events: boolean;
  ai: boolean;
};

const defaultModules: ModulePreferences = {
  work: true,
  money: true,
  splits: true,
  tasks: true,
  groceries: true,
  cleaning: true,
  coupons: false,
  events: false,
  ai: false,
};

type SettingsRecord = {
  id: string;
  userId: string;
  pushNotifications: boolean;
  emailUpdates: boolean;
  notifyClasses: boolean;
  notifyTasks: boolean;
  notifyWork: boolean;
  notifyGroceries: boolean;
  notifyCleaning: boolean;
  notifySplitSettlements: boolean;
  theme: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  aiSuggestionsEnabled: boolean;
  aiProviderStatus: string;
  aiFormSuggestionsAllowed: boolean;
  aiSuggestionsCacheClearedAt: Date | null;
  workCountry: string;
  yearlyWorkLimitDays: number;
  defaultHourlyWage: unknown;
  selectedModules?: unknown;
  createdAt: Date;
  updatedAt: Date;
};

let selectedModulesSupportPromise: Promise<boolean> | null = null;

async function supportsSelectedModules() {
  if (!selectedModulesSupportPromise) {
    selectedModulesSupportPromise = prisma.$queryRaw<
      Array<{ exists: boolean }>
    >`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'UserSettings'
          AND column_name = 'selectedModules'
      ) AS "exists"
    `
      .then((rows) => rows[0]?.exists ?? false)
      .catch(() => false);
  }

  return selectedModulesSupportPromise;
}

function normalizeModules(value: unknown): ModulePreferences {
  if (!value || typeof value !== "object") return defaultModules;

  const input = value as Partial<ModulePreferences>;
  return {
    ...defaultModules,
    ...Object.fromEntries(
      Object.entries(input).filter(([, flag]) => typeof flag === "boolean"),
    ),
  };
}

function serialize(record: SettingsRecord) {
  const selectedModules = normalizeModules(record.selectedModules);
  const defaultHourlyWage =
    record.defaultHourlyWage === null || record.defaultHourlyWage === undefined
      ? null
      : Number(record.defaultHourlyWage);

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
      defaultHourlyWage,
    },
    selectedModules,
    userEnabledModules: selectedModules,
    countryCode: record.workCountry,
    workLimitDays: record.yearlyWorkLimitDays,
    defaultHourlyWageCents:
      defaultHourlyWage !== null ? Math.round(defaultHourlyWage * 100) : null,
    pushNotifications: record.pushNotifications,
    emailUpdates: record.emailUpdates,
    reminderClasses: record.notifyClasses,
    reminderTasks: record.notifyTasks,
    reminderWork: record.notifyWork,
    reminderGroceries: record.notifyGroceries,
    reminderCleaning: record.notifyCleaning,
    reminderSplitSettlements: record.notifySplitSettlements,
    aiEnabled: record.aiSuggestionsEnabled,
    aiFormSuggestions: record.aiFormSuggestionsAllowed,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function ensureSettings(userId: string): Promise<SettingsRecord> {
  const [user, hasSelectedModules] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        country: true,
        currency: true,
        hourlyWageDefault: true,
      },
    }),
    supportsSelectedModules(),
  ]);

  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      pushNotifications: true,
      emailUpdates: true,
      notifyClasses: true,
      notifyTasks: true,
      notifyWork: true,
      notifyGroceries: true,
      notifyCleaning: true,
      notifySplitSettlements: true,
      theme: true,
      language: true,
      currency: true,
      dateFormat: true,
      timeFormat: true,
      aiSuggestionsEnabled: true,
      aiProviderStatus: true,
      aiFormSuggestionsAllowed: true,
      aiSuggestionsCacheClearedAt: true,
      workCountry: true,
      yearlyWorkLimitDays: true,
      defaultHourlyWage: true,
      createdAt: true,
      updatedAt: true,
      ...(hasSelectedModules ? { selectedModules: true } : {}),
    } as any,
  });

  if (settings) {
    return settings as unknown as SettingsRecord;
  }

  const data: Record<string, unknown> = {
    userId,
    workCountry: user.country,
    currency: user.currency,
    defaultHourlyWage: user.hourlyWageDefault,
  };

  if (hasSelectedModules) {
    data.selectedModules = defaultModules;
  }

  return prisma.userSettings.create({
    data,
  } as any) as unknown as SettingsRecord;
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

function moduleData(input: ModuleSettingsInput) {
  return {
    selectedModules: normalizeModules(input),
  };
}

async function updateSettings(userId: string, data: Record<string, unknown>) {
  await ensureSettings(userId);
  const updated = await prisma.userSettings.update({
    where: { userId },
    data,
  } as any);

  return serialize(updated as SettingsRecord);
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

  static async updateNotifications(
    userId: string,
    input: NotificationSettingsInput,
  ) {
    return updateSettings(userId, notificationData(input));
  }

  static async updatePreferences(
    userId: string,
    input: PreferenceSettingsInput,
  ) {
    const next = await updateSettings(userId, preferenceData(input));

    if (input.currency) {
      await prisma.user.update({
        where: { id: userId },
        data: { currency: input.currency.toUpperCase() },
      });
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

  static async updateModules(userId: string, input: ModuleSettingsInput) {
    if (!(await supportsSelectedModules())) {
      return serialize(await ensureSettings(userId));
    }

    return updateSettings(userId, moduleData(input));
  }
}
