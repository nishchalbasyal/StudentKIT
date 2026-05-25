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
  {
    key: "work",
    title: "Work hours",
    subtitle: "Track shifts, income, and limits.",
    icon: "briefcase-outline",
  },
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
      work: true,
      ai: false,
      money: false,
      splits: false,
      tasks: false,
      groceries: false,
      cleaning: false,
      coupons: false,
      events: false,
    };
    await saveOnboardingPreferences({
      userEnabledModules,
      completed: current.completed,
      useWithoutLogin: current.useWithoutLogin,
    });
    return userEnabledModules;
  },

  async completeOnboarding(
    modules: Partial<UserEnabledModules>,
    useWithoutLogin: boolean,
  ) {
    const userEnabledModules = {
      ...defaultModules,
      ...modules,
      work: true,
      ai: false,
      money: false,
      splits: false,
      tasks: false,
      groceries: false,
      cleaning: false,
      coupons: false,
      events: false,
    };
    return saveOnboardingPreferences({
      completed: true,
      useWithoutLogin,
      userEnabledModules,
    });
  },
};
