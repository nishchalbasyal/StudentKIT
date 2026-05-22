import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";
import type { Budget, BudgetInput, BudgetSummary } from "../types/budget.types";
import type { Expense } from "../types/expense.types";

function isCurrentBudget(budget: Budget, now = new Date()) {
  if (budget.isActive === false) return false;
  if (budget.periodStart && budget.periodEnd) {
    const start = new Date(budget.periodStart);
    const end = new Date(budget.periodEnd);
    return start <= now && end >= now;
  }

  return (
    budget.year === now.getFullYear() && budget.month === now.getMonth() + 1
  );
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function deriveSummaryBudgets(
  budgets: Budget[],
  expenses: Expense[],
  year: number,
  month: number,
): BudgetSummary[] {
  return budgets.map((budget) => {
    const budgetedAmount = Number(budget.amount ?? budget.amountCents ?? 0);
    const spentAmount = expenses
      .filter(
        (expense) => !budget.category || expense.category === budget.category,
      )
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      ...budget,
      budgetedAmount,
      spentAmount,
      remaining: budgetedAmount - spentAmount,
      percentUsed:
        budgetedAmount > 0
          ? Math.min(100, (spentAmount / budgetedAmount) * 100)
          : 0,
      year: budget.year ?? year,
      month: budget.month ?? month,
    };
  });
}

async function saveBudgetLocally(budget: Budget) {
  await localDb.upsert("budgets", budget as Budget & { id: string });
  return budget;
}

async function enqueueBudgetSync(
  operation: "CREATE" | "UPDATE" | "DELETE",
  entityId: string,
  payload: unknown,
) {
  await syncQueue.enqueue({
    entityType: "budget",
    entityId,
    operation,
    payload,
  });
}

export const budgetApi = {
  async getBudgets(): Promise<Budget[]> {
    if (!useAuthStore.getState().isAuthenticated) {
      return localDb.list("budgets");
    }

    try {
      const remote = unwrap<Budget[]>(await apiClient.get("/budgets"));
      await localDb.replace("budgets", remote as Budget[]);
      return remote;
    } catch {
      return localDb.list("budgets");
    }
  },

  async getCurrentBudgets(): Promise<Budget[]> {
    if (!useAuthStore.getState().isAuthenticated) {
      return (await localDb.list("budgets")).filter((budget) =>
        isCurrentBudget(budget),
      );
    }

    try {
      const remote = unwrap<Budget[]>(await apiClient.get("/budgets/current"));
      await localDb.replace("budgets", remote as Budget[]);
      return remote;
    } catch {
      return (await localDb.list("budgets")).filter((budget) =>
        isCurrentBudget(budget),
      );
    }
  },

  async getBudgetSummary(
    year: number,
    month?: number,
  ): Promise<BudgetSummary[]> {
    const targetMonth = month ?? new Date().getMonth() + 1;
    const monthKey = `${year}-${String(targetMonth).padStart(2, "0")}`;

    if (useAuthStore.getState().isAuthenticated) {
      try {
        return unwrap<BudgetSummary[]>(
          await apiClient.get("/budgets/summary", {
            params: { month: monthKey },
          }),
        );
      } catch {
        // Local fallback below.
      }
    }

    const budgets = (await localDb.list("budgets")).filter((budget) => {
      if (budget.periodStart && budget.periodEnd) {
        const { start, end } = monthRange(year, targetMonth);
        return (
          new Date(budget.periodStart) <= end &&
          new Date(budget.periodEnd) >= start
        );
      }
      return budget.year === year && budget.month === targetMonth;
    });

    const expenses = (await localDb.list("expenses")).filter((expense) => {
      const date = new Date(expense.date);
      return date.getFullYear() === year && date.getMonth() + 1 === targetMonth;
    });

    return deriveSummaryBudgets(budgets, expenses, year, targetMonth);
  },

  async createBudget(input: BudgetInput): Promise<Budget> {
    if (useAuthStore.getState().isAuthenticated) {
      try {
        const remote = unwrap<Budget>(await apiClient.post("/budgets", input));
        await saveBudgetLocally(remote);
        return remote;
      } catch {
        // Local fallback below.
      }
    }

    const local = await localDb.create("budgets", {
      ...input,
      category: input.category ?? null,
      notes: input.notes ?? null,
      amountCents: input.amountCents ?? Math.round(input.amount * 100),
      currency: input.currency ?? "EUR",
      isActive: input.isActive ?? true,
      syncedAt: null,
    } as never);
    if (useAuthStore.getState().isAuthenticated) {
      await enqueueBudgetSync("CREATE", local.id, local);
    }
    return local as Budget;
  },

  async updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
    const local = await localDb.update("budgets", id, {
      ...input,
      syncedAt: null,
    } as Partial<Budget>);

    if (useAuthStore.getState().isAuthenticated) {
      try {
        const remote = unwrap<Budget>(
          await apiClient.put(`/budgets/${id}`, input),
        );
        await saveBudgetLocally(remote);
        return remote;
      } catch {
        await enqueueBudgetSync("UPDATE", id, local ?? input);
      }
    }

    return (local ?? (await localDb.find("budgets", id))) as Budget;
  },

  async deleteBudget(id: string): Promise<{ id: string }> {
    await localDb.remove("budgets", id);
    if (useAuthStore.getState().isAuthenticated) {
      try {
        return unwrap<{ id: string }>(await apiClient.delete(`/budgets/${id}`));
      } catch {
        await enqueueBudgetSync("DELETE", id, { id });
      }
    }

    return { id };
  },
};
