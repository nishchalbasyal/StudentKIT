import { create } from "zustand";
import { getOnboardingPreferences, saveOnboardingPreferences } from "../storage/settingsStorage";
import type { AuthResponse, User } from "../types/auth.types";
import { deleteAuthItem, getAuthItem, setAuthItem } from "../utils/authStorage";

const accessTokenKey = "student-kit-access-token";
const refreshTokenKey = "student-kit-refresh-token";
const userKey = "student-kit-user";

type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasCompletedOnboarding: boolean;
  hydrate: () => Promise<void>;
  login: (session: AuthResponse) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isHydrated: false,
  isAuthenticated: false,
  isGuest: false,
  hasCompletedOnboarding: false,
  hydrate: async () => {
    try {
      const [token, refreshToken, userJson, onboarding] = await Promise.all([
        getAuthItem(accessTokenKey),
        getAuthItem(refreshTokenKey),
        getAuthItem(userKey),
        getOnboardingPreferences(),
      ]);

      let user: User | null = null;

      if (userJson) {
        try {
          user = JSON.parse(userJson) as User;
        } catch {
          await deleteAuthItem(userKey);
        }
      }

      set({
        user,
        token,
        refreshToken,
        isHydrated: true,
        isAuthenticated: Boolean(token && user),
        isGuest: onboarding.completed && onboarding.useWithoutLogin && !token,
        hasCompletedOnboarding: onboarding.completed,
      });
    } catch {
      set({
        user: null,
        token: null,
        refreshToken: null,
        isHydrated: true,
        isAuthenticated: false,
        isGuest: false,
        hasCompletedOnboarding: false,
      });
    }
  },
  login: async (session) => {
    await Promise.all([
      setAuthItem(accessTokenKey, session.tokens.accessToken),
      setAuthItem(refreshTokenKey, session.tokens.refreshToken),
      setAuthItem(userKey, JSON.stringify(session.user))
    ]);

    set({
      user: session.user,
      token: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      isHydrated: true,
      isAuthenticated: true,
      isGuest: false,
      hasCompletedOnboarding: true,
    });
    await saveOnboardingPreferences({ completed: true, useWithoutLogin: false });
  },
  continueAsGuest: async () => {
    await saveOnboardingPreferences({ completed: true, useWithoutLogin: true });
    set({
      user: null,
      token: null,
      refreshToken: null,
      isHydrated: true,
      isAuthenticated: false,
      isGuest: true,
      hasCompletedOnboarding: true,
    });
  },
  logout: async () => {
    await Promise.all([
      deleteAuthItem(accessTokenKey),
      deleteAuthItem(refreshTokenKey),
      deleteAuthItem(userKey)
    ]);

    set({
      user: null,
      token: null,
      refreshToken: null,
      isHydrated: true,
      isAuthenticated: false,
      isGuest: true,
      hasCompletedOnboarding: true,
    });
  },
  setUser: async (user) => {
    if (user) {
      await setAuthItem(userKey, JSON.stringify(user));
    } else {
      await deleteAuthItem(userKey);
    }

    set({
      user,
      isAuthenticated: Boolean(get().token && user),
      isGuest: Boolean(!get().token && get().hasCompletedOnboarding),
    });
  }
}));
