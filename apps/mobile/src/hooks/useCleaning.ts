import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeCleaningTaskApi,
  createCleaningTaskApi,
  deleteCleaningTaskApi,
  getCleaningTasksApi,
  updateCleaningTaskApi
} from "../api/cleaning.api";
import type { CleaningTaskInput } from "../types/cleaning.types";
import { reminderEngine } from "../services/reminderEngine";

export function useCleaning() {
  const queryClient = useQueryClient();
  const cleaning = useQuery({ queryKey: ["cleaning"], queryFn: getCleaningTasksApi });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cleaning"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: CleaningTaskInput) => createCleaningTaskApi(input),
    onSuccess: async (routine) => {
      await reminderEngine.createForCleaning(routine);
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CleaningTaskInput> }) =>
      updateCleaningTaskApi(id, input),
    onSuccess: async (routine) => {
      await reminderEngine.createForCleaning(routine);
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
  const completeMutation = useMutation({
    mutationFn: completeCleaningTaskApi,
    onSuccess: async (routine) => {
      await reminderEngine.createForCleaning(routine);
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });
  const deleteMutation = useMutation({ mutationFn: deleteCleaningTaskApi, onSuccess: invalidate });

  return {
    cleaning,
    createCleaningTask: createMutation.mutateAsync,
    updateCleaningTask: updateMutation.mutateAsync,
    completeCleaningTask: completeMutation.mutateAsync,
    deleteCleaningTask: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || completeMutation.isPending || deleteMutation.isPending
  };
}
