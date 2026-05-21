import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetApi } from "../api/budget.api";
import type { Budget, BudgetInput, BudgetSummary } from "../types/budget.types";

export const useBudgets = () => {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetApi.getBudgets(),
  });

  const createMutation = useMutation({
    mutationFn: (input: BudgetInput) => budgetApi.createBudget(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BudgetInput> }) =>
      budgetApi.updateBudget(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  return {
    budgets: budgetsQuery.data,
    isLoading: budgetsQuery.isLoading,
    isError: budgetsQuery.isError,
    refetch: budgetsQuery.refetch,
    createBudget: createMutation.mutate,
    updateBudget: updateMutation.mutate,
    deleteBudget: deleteMutation.mutate,
  };
};

export const useCurrentBudgets = () => {
  return useQuery({
    queryKey: ["budgets", "current"],
    queryFn: () => budgetApi.getCurrentBudgets(),
  });
};

export const useBudgetSummary = (year: number, month?: number) => {
  return useQuery({
    queryKey: ["budgets", "summary", year, month],
    queryFn: () => budgetApi.getBudgetSummary(year, month),
  });
};
