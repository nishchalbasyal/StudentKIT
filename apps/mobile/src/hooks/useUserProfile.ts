import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type UpdateUserInput } from "../api/users.api";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types/auth.types";

export const userKeys = {
  me: ["users", "me"] as const,
  summary: ["users", "me", "summary"] as const,
};

export function useUserProfile() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const guestUser: User = {
    id: "guest",
    name: "Guest Student",
    email: "Guest mode",
    country: "DE",
    studentStatus: "INTERNATIONAL" as const,
    currency: "EUR",
    hourlyWageDefault: null,
    university: null,
    course: null,
  };
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
    mutationFn: (input: UpdateUserInput) => usersApi.updateMe(input),
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
    user: isAuthenticated ? userQuery.data : guestUser,
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
