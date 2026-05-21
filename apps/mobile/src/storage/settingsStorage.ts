import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppSettings } from "../api/settings.api";

export type UserEnabledModules = {
  work: boolean;
  money: boolean;
  splits: boolean;
  tasks: boolean;
  groceries: boolean;
  cleaning: boolean;
  ai: boolean;
};

export type OnboardingPreferences = {
  completed: boolean;
  useWithoutLogin: boolean;
  userEnabledModules: UserEnabledModules;
  updatedAt: string;
};

const settingsKey = "student-kit.settings";
const onboardingKey = "student-kit.onboarding";

export const defaultModules: UserEnabledModules = {
  work: true,
  money: true,
  splits: true,
  tasks: true,
  groceries: true,
  cleaning: true,
  ai: false,
};

export const defaultSettings: AppSettings = {
  id: "local-settings",
  notifications: {
    pushNotifications: false,
    emailUpdates: false,
    reminderCategories: {
      classes: true,
      tasks: true,
      work: true,
      groceries: true,
      cleaning: true,
      splitSettlements: true,
    },
  },
  preferences: {
    theme: "SYSTEM",
    language: "en",
    currency: "EUR",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "24H",
  },
  ai: {
    aiSuggestionsEnabled: false,
    aiProviderStatus: "Coming soon",
    aiFormSuggestionsAllowed: true,
    aiSuggestionsCacheClearedAt: null,
  },
  work: {
    workCountry: "DE",
    yearlyWorkLimitDays: 140,
    defaultHourlyWage: null,
  },
  userEnabledModules: defaultModules,
  updatedAt: new Date(0).toISOString(),
};

export const defaultOnboardingPreferences: OnboardingPreferences = {
  completed: false,
  useWithoutLogin: true,
  userEnabledModules: defaultModules,
  updatedAt: new Date(0).toISOString(),
};

function mergeSettings(value?: Partial<AppSettings> | null): AppSettings {
  return {
    ...defaultSettings,
    ...value,
    notifications: {
      ...defaultSettings.notifications,
      ...value?.notifications,
      reminderCategories: {
        ...defaultSettings.notifications.reminderCategories,
        ...value?.notifications?.reminderCategories,
      },
    },
    preferences: {
      ...defaultSettings.preferences,
      ...value?.preferences,
    },
    ai: {
      ...defaultSettings.ai,
      ...value?.ai,
      aiProviderStatus: "Coming soon",
      aiSuggestionsEnabled: false,
    },
    work: {
      ...defaultSettings.work,
      ...value?.work,
    },
    userEnabledModules: {
      ...defaultModules,
      ...(value as AppSettings | undefined)?.userEnabledModules,
    },
    updatedAt: value?.updatedAt ?? new Date().toISOString(),
  };
}

export async function getLocalSettings() {
  const raw = await AsyncStorage.getItem(settingsKey);
  if (!raw) return mergeSettings();

  try {
    return mergeSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    await AsyncStorage.removeItem(settingsKey);
    return mergeSettings();
  }
}

export async function saveLocalSettings(settings: Partial<AppSettings>) {
  const next = mergeSettings({ ...(await getLocalSettings()), ...settings, updatedAt: new Date().toISOString() });
  await AsyncStorage.setItem(settingsKey, JSON.stringify(next));
  return next;
}

export async function updateLocalSettings(updater: (settings: AppSettings) => AppSettings) {
  const next = mergeSettings(updater(await getLocalSettings()));
  next.updatedAt = new Date().toISOString();
  await AsyncStorage.setItem(settingsKey, JSON.stringify(next));
  return next;
}

export async function getOnboardingPreferences() {
  const raw = await AsyncStorage.getItem(onboardingKey);
  if (!raw) return defaultOnboardingPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingPreferences>;
    return {
      ...defaultOnboardingPreferences,
      ...parsed,
      userEnabledModules: {
        ...defaultModules,
        ...parsed.userEnabledModules,
      },
    };
  } catch {
    await AsyncStorage.removeItem(onboardingKey);
    return defaultOnboardingPreferences;
  }
}

export async function saveOnboardingPreferences(input: Partial<OnboardingPreferences>) {
  const next = {
    ...(await getOnboardingPreferences()),
    ...input,
    userEnabledModules: {
      ...(await getOnboardingPreferences()).userEnabledModules,
      ...input.userEnabledModules,
    },
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(onboardingKey, JSON.stringify(next));
  await saveLocalSettings({ userEnabledModules: next.userEnabledModules } as Partial<AppSettings>);
  return next;
}
