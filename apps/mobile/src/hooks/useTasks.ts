import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeTaskApi,
  createTaskApi,
  deleteTaskApi,
  getTasksApi,
  getUpcomingTasksApi,
  updateTaskApi
} from "../api/tasks.api";
import type { TaskInput } from "../types/task.types";
import { reminderEngine } from "../services/reminderEngine";

export function useTasks() {
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: getTasksApi });
  const upcomingTasks = useQuery({ queryKey: ["tasks", "upcoming"], queryFn: getUpcomingTasksApi });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: TaskInput) => createTaskApi(input),
    onSuccess: async (task) => {
      if (task.reminderAt || task.dueDate) {
        await reminderEngine.createForTask(task);
      }
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) => updateTaskApi(id, input),
    onSuccess: async (task) => {
      if (task.reminderAt || task.dueDate) {
        await reminderEngine.createForTask(task);
      }
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });
  const completeMutation = useMutation({ mutationFn: completeTaskApi, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteTaskApi, onSuccess: invalidate });

  return {
    tasks,
    upcomingTasks,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    completeTask: completeMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isSaving:
      createMutation.isPending || updateMutation.isPending || completeMutation.isPending || deleteMutation.isPending
  };
}
