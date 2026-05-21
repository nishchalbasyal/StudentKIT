import type { Budget, Expense, ExpenseInput, ExpenseSummary } from "../types/expense.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

export async function getExpensesApi() {
  if (!useAuthStore.getState().isAuthenticated) return localDb.list("expenses");
  try {
    const remote = unwrap<Expense[]>(await apiClient.get("/expenses"));
    await localDb.replace("expenses", await remote);
    return remote;
  } catch {
    return localDb.list("expenses");
  }
}

export async function createExpenseApi(input: ExpenseInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<Expense>(await apiClient.post("/expenses", input));
      await localDb.upsert("expenses", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("expenses", input);
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "expense", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local;
}

export async function updateExpenseApi(id: string, input: Partial<ExpenseInput>) {
  const local = await localDb.update("expenses", id, input);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<Expense>(await apiClient.put(`/expenses/${id}`, input));
      await localDb.upsert("expenses", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "expense", entityId: id, operation: "UPDATE", payload: local ?? input });
    }
  }
  return local as Expense;
}

export async function deleteExpenseApi(id: string) {
  await localDb.remove("expenses", id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(await apiClient.delete(`/expenses/${id}`));
    } catch {
      await syncQueue.enqueue({ entityType: "expense", entityId: id, operation: "DELETE", payload: { id } });
    }
  }
  return { id };
}

export async function getMonthlyExpenseSummaryApi(year: number, month: number) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<ExpenseSummary>(
        await apiClient.get("/expenses/summary/monthly", { params: { year, month } })
      );
    } catch {
      // Local fallback below.
    }
  }
  const expenses = (await localDb.list("expenses")).filter((expense) => {
    const date = new Date(expense.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });
  const categoryMap = new Map<string, number>();
  const totalExpenses = expenses.reduce((sum, expense) => {
    categoryMap.set(expense.category, (categoryMap.get(expense.category) ?? 0) + expense.amount);
    return sum + expense.amount;
  }, 0);
  return {
    year,
    month,
    totalIncome: 0,
    totalExpenses,
    monthlySavings: -totalExpenses,
    categoryTotals: Array.from(categoryMap.entries()).map(([category, total]) => ({ category: category as never, total })),
  };
}

export async function getBudgetsApi(year?: number, month?: number) {
  if (!useAuthStore.getState().isAuthenticated) {
    const budgets = await localDb.list("budgets");
    return budgets.filter((budget) => (!year || budget.year === year) && (!month || budget.month === month));
  }
  try {
    const remote = unwrap<Budget[]>(await apiClient.get("/budgets", { params: { year, month } }));
    await localDb.replace("budgets", await remote);
    return remote;
  } catch {
    const budgets = await localDb.list("budgets");
    return budgets.filter((budget) => (!year || budget.year === year) && (!month || budget.month === month));
  }
}

export async function createBudgetApi(input: Omit<Budget, "id">) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<Budget>(await apiClient.post("/budgets", input));
      await localDb.upsert("budgets", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("budgets", input);
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "budget", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local;
}
