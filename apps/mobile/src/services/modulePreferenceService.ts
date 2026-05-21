import {
  defaultModules,
  getOnboardingPreferences,
  saveOnboardingPreferences,
  type UserEnabledModules,
} from "../storage/settingsStorage";

export type ModuleKey = keyof UserEnabledModules;

export const moduleOptions: Array<{
  key: ModuleKey;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  { key: "work", title: "Work hours", subtitle: "Track shifts, income, and limits.", icon: "briefcase-outline" },
  { key: "money", title: "Expenses & budgets", subtitle: "Follow spending and monthly budgets.", icon: "wallet-outline" },
  { key: "splits", title: "Split expenses", subtitle: "Track roommate and friend balances.", icon: "people-outline" },
  { key: "tasks", title: "Tasks & reminders", subtitle: "Keep assignments and life admin visible.", icon: "checkmark-circle-outline" },
  { key: "groceries", title: "Groceries", subtitle: "Remember essentials and shopping needs.", icon: "basket-outline" },
  { key: "cleaning", title: "Cleaning routines", subtitle: "Rotate shared chores and reminders.", icon: "sparkles-outline" },
  { key: "ai", title: "AI assistant", subtitle: "Coming soon. Core features work manually.", icon: "chatbubble-ellipses-outline" },
];

export const modulePreferenceService = {
  async get() {
    return (await getOnboardingPreferences()).userEnabledModules;
  },

  async set(modules: Partial<UserEnabledModules>) {
    const current = await getOnboardingPreferences();
    const userEnabledModules = {
      ...defaultModules,
      ...current.userEnabledModules,
      ...modules,
      ai: false,
    };
    await saveOnboardingPreferences({ userEnabledModules });
    return userEnabledModules;
  },

  async completeOnboarding(modules: Partial<UserEnabledModules>, useWithoutLogin: boolean) {
    const userEnabledModules = {
      ...defaultModules,
      ...modules,
      ai: false,
    };
    return saveOnboardingPreferences({
      completed: true,
      useWithoutLogin,
      userEnabledModules,
    });
  },
};
