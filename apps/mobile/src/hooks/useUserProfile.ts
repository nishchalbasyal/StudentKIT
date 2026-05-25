import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type UpdateUserInput } from "../api/users.api";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types/auth.types";
import { updateLocalSettings } from "../storage/settingsStorage";

export const userKeys = {
  me: ["users", "me"] as const,
  summary: ["users", "me", "summary"] as const,
};

type LocalProfileInput = UpdateUserInput & {
  username?: string | null;
};

function buildFallbackUser(user?: Partial<User> | null): User {
  return {
    id: user?.id ?? "guest",
    name: user?.name ?? "Guest Student",
    username: user?.username ?? null,
    email: user?.email ?? "Guest mode",
    country: user?.country ?? "DE",
    studentStatus: user?.studentStatus ?? "INTERNATIONAL",
    currency: user?.currency ?? "EUR",
    hourlyWageDefault: user?.hourlyWageDefault ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    university: user?.university ?? null,
    course: user?.course ?? null,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };
}

export function useUserProfile() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const guestUser = buildFallbackUser(storedUser);
  const guestSummary = {
    totalSaved: 0,
    workStreak: 0,
    expensesTracked: 0,
    tasksCompleted: 0,
    activeSplitGroups: 0,
    currency: "EUR",
  };

  const userQuery = useQuery({
    queryKey: userKeys.me,
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });
  const summaryQuery = useQuery({
    queryKey: userKeys.summary,
    queryFn: usersApi.getSummary,
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: LocalProfileInput) => {
      const currentUser = buildFallbackUser(useAuthStore.getState().user);
      const nextUser: User = {
        ...currentUser,
        ...input,
        username: input.username ?? currentUser.username ?? null,
        email: input.email ?? currentUser.email,
        country: input.country?.toUpperCase() ?? currentUser.country,
        currency: input.currency?.toUpperCase() ?? currentUser.currency,
        avatarUrl: input.avatarUrl ?? currentUser.avatarUrl ?? null,
        university: input.university ?? currentUser.university ?? null,
        course: input.course ?? currentUser.course ?? null,
      };

      await updateLocalSettings((currentSettings) => ({
        ...currentSettings,
        preferences: {
          ...currentSettings.preferences,
          currency: nextUser.currency,
        },
        work: {
          ...currentSettings.work,
          workCountry: nextUser.country,
          defaultHourlyWage:
            input.hourlyWageDefault ?? nextUser.hourlyWageDefault ?? null,
          yearlyWorkLimitDays:
            input.yearlyWorkLimitDays ?? currentSettings.work.yearlyWorkLimitDays,
        },
      }));

      if (!isAuthenticated) {
        return nextUser;
      }

      try {
        const remoteUser = await usersApi.updateMe({
          ...input,
          email: input.email,
        });
        return {
          ...nextUser,
          ...remoteUser,
          username: nextUser.username ?? null,
        };
      } catch {
        return nextUser;
      }
    },
    onSuccess: async (user) => {
      await setUser(user);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.me }),
        queryClient.invalidateQueries({ queryKey: userKeys.summary }),
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteMe,
    onSuccess: async () => {
      queryClient.clear();
      await logout();
    },
  });

  return {
    user: isAuthenticated
      ? buildFallbackUser({
          ...storedUser,
          ...userQuery.data,
          username: storedUser?.username ?? null,
        })
      : guestUser,
    summary: isAuthenticated ? summaryQuery.data : guestSummary,
    isLoading: isAuthenticated && (userQuery.isLoading || summaryQuery.isLoading),
    isError: isAuthenticated && (userQuery.isError || summaryQuery.isError),
    refetch: async () => {
      await Promise.all([userQuery.refetch(), summaryQuery.refetch()]);
    },
    updateProfile: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
