import { prisma } from "../../database/prisma.js";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "./budgets.schemas.js";

export class BudgetsService {
  static async getAllBudgets(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  static async getBudget(id: string, userId: string) {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found or unauthorized");
    }
    return budget;
  }

  static async getCurrentBudgets(userId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return prisma.budget.findMany({
      where: {
        userId,
        year,
        month,
      },
    });
  }

  static async createBudget(userId: string, data: CreateBudgetInput) {
    return prisma.budget.create({
      data: {
        userId,
        year: data.year,
        month: data.month ?? 1,
        week: data.week ?? null,
        category: data.category ?? null,
        amount: data.amount,
        notes: data.notes ?? null,
      },
    });
  }

  static async updateBudget(
    id: string,
    userId: string,
    data: UpdateBudgetInput,
  ) {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found or unauthorized");
    }

    return prisma.budget.update({
      where: { id },
      data: {
        year: data.year ?? budget.year,
        month: data.month ?? budget.month,
        week: data.week ?? budget.week,
        category: data.category ?? budget.category,
        amount: data.amount ?? budget.amount,
        notes: data.notes ?? budget.notes,
      },
    });
  }

  static async deleteBudget(id: string, userId: string) {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found or unauthorized");
    }

    return prisma.budget.delete({ where: { id } });
  }

  static async getBudgetSummary(userId: string, year: number, month?: number) {
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        year,
        ...(month && { month }),
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: month
            ? new Date(`${year}-${String(month).padStart(2, "0")}-01`)
            : new Date(`${year}-01-01`),
          lt: month
            ? new Date(`${year}-${String(month + 1).padStart(2, "0")}-01`)
            : new Date(`${year + 1}-01-01`),
        },
      },
    });

    const summary = budgets.map((budget) => {
      const spent = expenses
        .filter((e) => !budget.category || e.category === budget.category)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        ...budget,
        budgetedAmount: Number(budget.amount),
        spentAmount: spent,
        remaining: Number(budget.amount) - spent,
        percentUsed: (spent / Number(budget.amount)) * 100,
      };
    });

    return summary;
  }
}
