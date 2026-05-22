import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  workLimitApi,
  type WorkLimitSettingsInput,
} from "../api/workLimit.api";
import { userKeys } from "./useUserProfile";

export const workLimitKeys = {
  all: ["workLimit"] as const,
  settings: ["workLimit", "settings"] as const,
  summary: ["workLimit", "summary"] as const,
};

export function useWorkLimitSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: workLimitKeys.settings,
    queryFn: workLimitApi.getSettings,
  });
  const summaryQuery = useQuery({
    queryKey: workLimitKeys.summary,
    queryFn: workLimitApi.getSummary,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: workLimitKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["workSummary"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: userKeys.summary }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: (input: WorkLimitSettingsInput) =>
      workLimitApi.saveSettings(input),
    onSuccess: invalidate,
  });

  const resetMutation = useMutation({
    mutationFn: workLimitApi.resetToUnlimited,
    onSuccess: invalidate,
  });

  const dismissMutation = useMutation({
    mutationFn: workLimitApi.dismissUnlimitedBanner,
    onSuccess: invalidate,
  });

  return {
    settings: settingsQuery.data,
    summary: summaryQuery.data,
    isLoading: settingsQuery.isLoading || summaryQuery.isLoading,
    isError: settingsQuery.isError || summaryQuery.isError,
    refetch: async () => {
      await Promise.all([settingsQuery.refetch(), summaryQuery.refetch()]);
    },
    saveWorkLimitSettings: saveMutation.mutateAsync,
    resetWorkLimitSettings: resetMutation.mutateAsync,
    dismissUnlimitedBanner: dismissMutation.mutateAsync,
    isSaving:
      saveMutation.isPending ||
      resetMutation.isPending ||
      dismissMutation.isPending,
  };
}
