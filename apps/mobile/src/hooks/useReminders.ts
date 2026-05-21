import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeReminderApi, getRemindersApi } from "../api/reminders.api";

export function useReminders() {
  const queryClient = useQueryClient();
  const reminders = useQuery({ queryKey: ["reminders"], queryFn: getRemindersApi });

  const completeMutation = useMutation({
    mutationFn: completeReminderApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return {
    reminders,
    completeReminder: completeMutation.mutateAsync,
    isSaving: completeMutation.isPending
  };
}

