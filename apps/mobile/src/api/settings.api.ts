import { apiClient, unwrap } from "./apiClient";
import {
  defaultModules,
  getLocalSettings,
  saveLocalSettings,
  updateLocalSettings,
} from "../storage/settingsStorage";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";
import { modulePreferenceService } from "../services/modulePreferenceService";
import type { UserEnabledModules } from "../storage/settingsStorage";

export type ThemePreference = "SYSTEM" | "LIGHT" | "DARK";
export type DateFormatPreference = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type TimeFormatPreference = "24H" | "12H";
export type WorkLimitMode = "YEARLY_DAYS" | "WEEKLY_HOURS";

export type AppSettings = {
  id: string;
  notifications: {
    pushNotifications: boolean;
    emailUpdates: boolean;
    reminderCategories: {
      classes: boolean;
      tasks: boolean;
      work: boolean;
      groceries: boolean;
      cleaning: boolean;
      splitSettlements: boolean;
    };
  };
  preferences: {
    theme: ThemePreference;
    language: string;
    currency: string;
    dateFormat: DateFormatPreference;
    timeFormat: TimeFormatPreference;
  };
  ai: {
    aiSuggestionsEnabled: boolean;
    aiProviderStatus: string;
    aiFormSuggestionsAllowed: boolean;
    aiSuggestionsCacheClearedAt?: string | null;
  };
  work: {
    workCountry: string;
    workLimitMode: WorkLimitMode;
    yearlyWorkLimitDays: number;
    weeklyWorkLimitHours?: number | null;
    defaultHourlyWage?: number | null;
  };
  userEnabledModules?: {
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
  selectedModules?: {
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
  updatedAt: string;
};

export type NotificationSettingsInput = Partial<
  Omit<AppSettings["notifications"], "reminderCategories">
> & {
  reminderCategories?: Partial<
    AppSettings["notifications"]["reminderCategories"]
  >;
};
export type PreferenceSettingsInput = Partial<AppSettings["preferences"]>;
export type AISettingsInput = Partial<
  Pick<AppSettings["ai"], "aiSuggestionsEnabled" | "aiFormSuggestionsAllowed">
> & {
  clearCache?: boolean;
};
export type WorkSettingsInput = Partial<AppSettings["work"]>;
export type ModuleSettingsInput = Partial<UserEnabledModules>;
export type UpdateSettingsInput = NotificationSettingsInput &
  PreferenceSettingsInput &
  AISettingsInput &
  WorkSettingsInput;

async function maybeSyncSettings(
  settings: AppSettings,
  endpoint = "/settings",
  payload?: unknown,
) {
  if (!useAuthStore.getState().isAuthenticated) return settings;

  try {
    const remote = unwrap<AppSettings>(
      await apiClient.put(endpoint, payload ?? settings),
    );
    return saveLocalSettings(await remote);
  } catch (error) {
    await syncQueue.enqueue({
      entityType: "settings",
      entityId: settings.id,
      operation: "UPDATE",
      payload: settings,
    });
    return settings;
  }
}

export const settingsApi = {
  async getSettings() {
    if (!useAuthStore.getState().isAuthenticated) {
      return getLocalSettings();
    }

    try {
      const settings = unwrap<AppSettings>(await apiClient.get("/settings"));
      return saveLocalSettings(await settings);
    } catch {
      return getLocalSettings();
    }
  },
  async updateSettings(input: UpdateSettingsInput) {
    const local = await updateLocalSettings((settings) => ({
      ...settings,
      notifications: {
        ...settings.notifications,
        pushNotifications:
          input.pushNotifications ?? settings.notifications.pushNotifications,
        emailUpdates: input.emailUpdates ?? settings.notifications.emailUpdates,
        reminderCategories: {
          ...settings.notifications.reminderCategories,
          ...input.reminderCategories,
        },
      },
      preferences: { ...settings.preferences, ...input },
      ai: {
        ...settings.ai,
        aiSuggestionsEnabled: false,
        aiFormSuggestionsAllowed:
          input.aiFormSuggestionsAllowed ??
          settings.ai.aiFormSuggestionsAllowed,
        aiProviderStatus: "Coming soon",
        aiSuggestionsCacheClearedAt: input.clearCache
          ? new Date().toISOString()
          : settings.ai.aiSuggestionsCacheClearedAt,
      },
      work: { ...settings.work, ...input },
    }));
    return maybeSyncSettings(local, "/settings", input);
  },
  async updateNotifications(input: NotificationSettingsInput) {
    const local = await updateLocalSettings((settings) => ({
      ...settings,
      notifications: {
        ...settings.notifications,
        pushNotifications:
          input.pushNotifications ?? settings.notifications.pushNotifications,
        emailUpdates: input.emailUpdates ?? settings.notifications.emailUpdates,
        reminderCategories: {
          ...settings.notifications.reminderCategories,
          ...input.reminderCategories,
        },
      },
    }));
    return maybeSyncSettings(local, "/settings/notifications", input);
  },
  async updatePreferences(input: PreferenceSettingsInput) {
    const local = await updateLocalSettings((settings) => ({
      ...settings,
      preferences: { ...settings.preferences, ...input },
    }));
    return maybeSyncSettings(local, "/settings/preferences", input);
  },
  async updateAI(input: AISettingsInput) {
    const local = await updateLocalSettings((settings) => ({
      ...settings,
      ai: {
        ...settings.ai,
        aiSuggestionsEnabled: false,
        aiFormSuggestionsAllowed:
          input.aiFormSuggestionsAllowed ??
          settings.ai.aiFormSuggestionsAllowed,
        aiProviderStatus: "Coming soon",
        aiSuggestionsCacheClearedAt: input.clearCache
          ? new Date().toISOString()
          : settings.ai.aiSuggestionsCacheClearedAt,
      },
    }));
    return maybeSyncSettings(local, "/settings/ai", {
      ...input,
      aiSuggestionsEnabled: false,
    });
  },
  async updateWork(input: WorkSettingsInput) {
    const local = await updateLocalSettings((settings) => ({
      ...settings,
      work: { ...settings.work, ...input },
    }));
    return maybeSyncSettings(local, "/settings/work", input);
  },
  async updateModules(input: ModuleSettingsInput) {
    // Update local settings
    const local = await updateLocalSettings((settings) => ({
      ...settings,
      userEnabledModules: {
        ...defaultModules,
        ...settings.userEnabledModules,
        ...input,
      },
      selectedModules: {
        ...defaultModules,
        ...settings.selectedModules,
        ...input,
      },
    }));
    // Also update onboarding preferences to keep them in sync
    await modulePreferenceService.set(input);
    // Sync to backend if authenticated
    return maybeSyncSettings(local, "/settings/modules", input);
  },
};
