import { apiClient, unwrap } from "./apiClient";
import type { Budget, BudgetInput, BudgetSummary } from "../types/budget.types";

export const budgetApi = {
  async getBudgets(): Promise<Budget[]> {
    return unwrap<Budget[]>(await apiClient.get("/budgets"));
  },

  async getCurrentBudgets(): Promise<Budget[]> {
    return unwrap<Budget[]>(await apiClient.get("/budgets/current"));
  },

  async getBudgetSummary(
    year: number,
    month?: number,
  ): Promise<BudgetSummary[]> {
    const params = month ? { month: `${year}-${String(month).padStart(2, "0")}` } : { year };
    return unwrap<BudgetSummary[]>(await apiClient.get("/budgets/summary", { params }));
  },

  async createBudget(input: BudgetInput): Promise<Budget> {
    return unwrap<Budget>(await apiClient.post("/budgets", input));
  },

  async updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
    return unwrap<Budget>(await apiClient.put(`/budgets/${id}`, input));
  },

  async deleteBudget(id: string): Promise<{ id: string }> {
    return unwrap<{ id: string }>(await apiClient.delete(`/budgets/${id}`));
  },
};
