import { useMemo } from "react";
import {
  getBreakSuggestion,
  getCompanySuggestions,
  getExpenseAmountSuggestions,
  getExpenseCategorySuggestion,
  getExpenseTitleSuggestions,
  getPaymentSuggestions,
  getShiftTimeSuggestion,
  getTaskTitleSuggestions,
  getWageSuggestion
} from "../utils/suggestionEngine";
import type { Expense } from "../types/expense.types";
import type { StudentTask } from "../types/task.types";
import type { WorkShift } from "../types/work.types";

export function useSmartSuggestions({
  expenses = [],
  workShifts = [],
  tasks = [],
  expenseQuery = "",
  company = "",
  taskQuery = ""
}: {
  expenses?: Expense[];
  workShifts?: WorkShift[];
  tasks?: StudentTask[];
  expenseQuery?: string;
  company?: string;
  taskQuery?: string;
}) {
  return useMemo(
    () => ({
      expenseTitles: getExpenseTitleSuggestions(expenseQuery, expenses),
      expenseAmounts: getExpenseAmountSuggestions(expenseQuery, expenses),
      expenseCategory: getExpenseCategorySuggestion(expenseQuery, expenses),
      paymentMethods: getPaymentSuggestions(expenses),
      companies: getCompanySuggestions(workShifts),
      wage: getWageSuggestion(company, workShifts),
      breakMinutes: getBreakSuggestion(company, workShifts),
      shiftTime: getShiftTimeSuggestion(company, workShifts),
      taskTitles: getTaskTitleSuggestions(taskQuery, tasks)
    }),
    [company, expenseQuery, expenses, taskQuery, tasks, workShifts]
  );
}
