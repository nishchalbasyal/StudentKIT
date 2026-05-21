import { useEffect } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginApi, registerApi } from "../api/auth.api";
import { getApiErrorMessage } from "../api/apiClient";
import { syncService } from "../services/syncService";
import { useAuthStore } from "../store/authStore";
import type { LoginInput, RegisterInput } from "../types/auth.types";

export function useAuthBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  return isHydrated;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.login);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const clearSession = useAuthStore((state) => state.logout);

  async function promptLocalSync() {
    if (!(await syncService.hasLocalData())) return;
    Alert.alert(
      "Sync local data?",
      "StudentKit found data saved on this device. Sync it to your account as a backup?",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Sync",
          onPress: () => {
            void syncService.syncLocalDataAfterLogin();
          },
        },
      ],
    );
  }

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => loginApi(input),
    onSuccess: async (session) => {
      await setSession(session);
      void promptLocalSync();
    }
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => registerApi(input),
    onSuccess: async (session) => {
      await setSession(session);
      void promptLocalSync();
    }
  });

  async function logout() {
    await clearSession();
    queryClient.clear();
  }

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    continueAsGuest,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    authError: loginMutation.error
      ? getApiErrorMessage(loginMutation.error)
      : registerMutation.error
        ? getApiErrorMessage(registerMutation.error)
        : null
  };
}
