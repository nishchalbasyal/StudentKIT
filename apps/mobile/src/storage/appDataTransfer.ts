import { exportLocalWorkLimitSettings, importLocalWorkLimitSettings } from "../api/workLimit.api";
import { getLocalSettings, getOnboardingPreferences, saveLocalSettings, saveOnboardingPreferences } from "./settingsStorage";
import { localDb, type LocalCollectionName, type LocalCollections } from "./localDb";
import { useAuthStore } from "../store/authStore";
import { buildExportUser } from "../utils/profileData";

const collections: LocalCollectionName[] = [
  "tasks",
  "reminders",
  "workEntries",
  "companies",
  "expenses",
  "budgets",
  "groceries",
  "shoppingList",
  "cleaningRoutines",
  "splitGroups",
  "splitMembers",
  "splitExpenses",
  "splitSettlements",
];

export type AppDataExport = {
  version: 1;
  exportedAt: string;
  user: ReturnType<typeof buildExportUser> | null;
  settings: Awaited<ReturnType<typeof getLocalSettings>>;
  onboarding: Awaited<ReturnType<typeof getOnboardingPreferences>>;
  workLimit: Awaited<ReturnType<typeof exportLocalWorkLimitSettings>>;
  collections: Partial<LocalCollections>;
};

export async function exportAppData(): Promise<AppDataExport> {
  const [settings, onboarding, workLimit] = await Promise.all([
    getLocalSettings(),
    getOnboardingPreferences(),
    exportLocalWorkLimitSettings(),
  ]);

  const entries = await Promise.all(
    collections.map(async (collection) => [
      collection,
      await localDb.list(collection),
    ] as const),
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: buildExportUser(useAuthStore.getState().user),
    settings,
    onboarding,
    workLimit,
    collections: Object.fromEntries(entries) as Partial<LocalCollections>,
  };
}

export async function importAppData(payload: AppDataExport) {
  await Promise.all([
    saveLocalSettings(payload.settings ?? {}),
    saveOnboardingPreferences(payload.onboarding ?? {}),
    importLocalWorkLimitSettings(payload.workLimit),
  ]);

  for (const collection of collections) {
    const value = payload.collections?.[collection];
    if (Array.isArray(value)) {
      await localDb.replace(
        collection,
        value as LocalCollections[typeof collection],
      );
    }
  }

  if (payload.user) {
    await useAuthStore.getState().setUser(payload.user);
  } else if (!useAuthStore.getState().token) {
    await useAuthStore.getState().setUser(null);
  }
}
