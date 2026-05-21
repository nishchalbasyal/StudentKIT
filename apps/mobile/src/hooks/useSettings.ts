import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  settingsApi,
  type AISettingsInput,
  type NotificationSettingsInput,
  type PreferenceSettingsInput,
  type WorkSettingsInput,
  type ModuleSettingsInput,
} from "../api/settings.api";
import { userKeys } from "./useUserProfile";

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.getSettings,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
      queryClient.invalidateQueries({ queryKey: userKeys.me }),
      queryClient.invalidateQueries({ queryKey: userKeys.summary }),
    ]);
  };

  const notificationMutation = useMutation({
    mutationFn: (input: NotificationSettingsInput) =>
      settingsApi.updateNotifications(input),
    onSuccess: invalidate,
  });

  const preferenceMutation = useMutation({
    mutationFn: (input: PreferenceSettingsInput) =>
      settingsApi.updatePreferences(input),
    onSuccess: invalidate,
  });

  const aiMutation = useMutation({
    mutationFn: (input: AISettingsInput) => settingsApi.updateAI(input),
    onSuccess: invalidate,
  });

  const workMutation = useMutation({
    mutationFn: (input: WorkSettingsInput) => settingsApi.updateWork(input),
    onSuccess: invalidate,
  });

  const modulesMutation = useMutation({
    mutationFn: (input: ModuleSettingsInput) =>
      settingsApi.updateModules(input),
    onSuccess: invalidate,
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    refetch: settingsQuery.refetch,
    updateNotifications: notificationMutation.mutateAsync,
    updatePreferences: preferenceMutation.mutateAsync,
    updateAI: aiMutation.mutateAsync,
    updateWork: workMutation.mutateAsync,
    updateModules: modulesMutation.mutateAsync,
    isSaving:
      notificationMutation.isPending ||
      preferenceMutation.isPending ||
      aiMutation.isPending ||
      workMutation.isPending ||
      modulesMutation.isPending,
  };
}
