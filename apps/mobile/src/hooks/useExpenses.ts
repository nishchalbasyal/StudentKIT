import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpenseApi,
  deleteExpenseApi,
  getExpensesApi,
  getMonthlyExpenseSummaryApi,
  updateExpenseApi
} from "../api/expenses.api";
import type { ExpenseInput } from "../types/expense.types";
import { getCurrentMonthParams } from "../utils/formatDate";

export function useExpenses() {
  const queryClient = useQueryClient();
  const { year, month } = getCurrentMonthParams();
  const expenses = useQuery({ queryKey: ["expenses"], queryFn: getExpensesApi });
  const summary = useQuery({
    queryKey: ["expenseSummary", month],
    queryFn: () => getMonthlyExpenseSummaryApi(year, month)
  });

  const createMutation = useMutation({
    mutationFn: (input: ExpenseInput) => createExpenseApi(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ExpenseInput> }) =>
      updateExpenseApi(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpenseApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return {
    expenses,
    summary,
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

