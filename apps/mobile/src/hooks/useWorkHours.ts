import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkShiftApi,
  deleteWorkShiftApi,
  getMonthlyWorkSummaryApi,
  getWeeklyWorkSummaryApi,
  getWorkShiftsApi,
  updateWorkShiftApi
} from "../api/work.api";
import type { WorkShiftInput } from "../types/work.types";
import { getCurrentMonthParams } from "../utils/formatDate";
import { reminderEngine } from "../services/reminderEngine";

type UseWorkHoursOptions = {
  year?: number;
  month?: number;
};

export function useWorkHours(options: UseWorkHoursOptions = {}) {
  const queryClient = useQueryClient();
  const currentMonth = getCurrentMonthParams();
  const year = options.year ?? currentMonth.year;
  const month = options.month ?? currentMonth.month;
  const workShifts = useQuery({ queryKey: ["workShifts"], queryFn: getWorkShiftsApi });
  const monthlySummary = useQuery({
    queryKey: ["workSummary", "monthly", year, month],
    queryFn: () => getMonthlyWorkSummaryApi(year, month)
  });
  const weeklySummary = useQuery({
    queryKey: ["workSummary", "weekly"],
    queryFn: () => getWeeklyWorkSummaryApi()
  });

  const createMutation = useMutation({
    mutationFn: (input: WorkShiftInput) => createWorkShiftApi(input),
    onSuccess: async (shift) => {
      await reminderEngine.createForWork(shift);
      await queryClient.invalidateQueries({ queryKey: ["workShifts"] });
      await queryClient.invalidateQueries({ queryKey: ["workSummary"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WorkShiftInput> }) =>
      updateWorkShiftApi(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workShifts"] });
      await queryClient.invalidateQueries({ queryKey: ["workSummary"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkShiftApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workShifts"] });
      await queryClient.invalidateQueries({ queryKey: ["workSummary"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return {
    workShifts,
    monthlySummary,
    weeklySummary,
    createWorkShift: createMutation.mutateAsync,
    updateWorkShift: updateMutation.mutateAsync,
    deleteWorkShift: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}
