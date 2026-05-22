import type { ExpenseCategory } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type {
  BudgetSyncInput,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "./budgets.schemas.js";

type BudgetTypeValue = "WEEKLY" | "MONTHLY" | "CATEGORY" | "SAVINGS";

type BudgetRecord = {
  id: string;
  localId: string;
  userId: string;
  type: BudgetTypeValue;
  categoryId: string | null;
  year: number;
  month: number;
  week: number | null;
  category: ExpenseCategory | null;
  amount: number;
  amountCents: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  isActive: boolean;
  notes: string | null;
  syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const categoryValues: ExpenseCategory[] = [
  "GROCERIES",
  "RENT",
  "TRANSPORT",
  "FOOD",
  "STUDY",
  "HEALTH",
  "ENTERTAINMENT",
  "BILLS",
  "SHOPPING",
  "OTHER",
];

function getMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function getEndOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function startOfIsoWeek(date: Date) {
  const start = new Date(date);
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toCents(amount?: number | null, amountCents?: number | null) {
  if (typeof amountCents === "number" && Number.isFinite(amountCents))
    return Math.max(0, Math.round(amountCents));
  if (typeof amount === "number" && Number.isFinite(amount))
    return Math.max(0, Math.round(amount * 100));
  return 0;
}

function toAmount(amount?: number | null, amountCents?: number | null) {
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amountCents === "number" && Number.isFinite(amountCents))
    return amountCents / 100;
  return 0;
}

function resolveType(input: {
  type?: BudgetTypeValue | null;
  week?: number | null;
  category?: ExpenseCategory | null;
  categoryId?: string | null;
}) {
  if (input.type) return input.type;
  if (input.week) return "WEEKLY";
  if (input.category || input.categoryId) return "CATEGORY";
  return "MONTHLY";
}

function resolvePeriod(input: CreateBudgetInput | UpdateBudgetInput) {
  if (input.periodStart) {
    const start = new Date(input.periodStart);
    const end = input.periodEnd ? new Date(input.periodEnd) : new Date(start);
    if (!input.periodEnd) {
      if (input.type === "WEEKLY" || input.week) {
        end.setUTCDate(end.getUTCDate() + 6);
      } else if (input.type === "SAVINGS") {
        end.setUTCFullYear(end.getUTCFullYear() + 1);
      } else {
        end.setUTCMonth(end.getUTCMonth() + 1);
      }
    }
    return { periodStart: start, periodEnd: end };
  }

  const year = input.year ?? new Date().getUTCFullYear();
  const month = input.month ?? new Date().getUTCMonth() + 1;
  if (input.week) {
    const start = startOfIsoWeek(new Date(Date.UTC(year, month - 1, 1)));
    return { periodStart: start, periodEnd: addDays(start, 6) };
  }

  if (input.type === "SAVINGS") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(start);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    return { periodStart: start, periodEnd: end };
  }

  const range = getMonthRange(year, month);
  return { periodStart: range.start, periodEnd: getEndOfMonth(year, month) };
}

function serializeBudget(record: BudgetRecord) {
  return {
    id: record.id,
    localId: record.localId,
    userId: record.userId,
    type: record.type,
    categoryId: record.categoryId,
    year: record.year,
    month: record.month,
    week: record.week,
    category: record.category,
    amount: record.amount,
    amountCents: record.amountCents,
    currency: record.currency,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    isActive: record.isActive,
    notes: record.notes,
    syncedAt: record.syncedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function normalizeCategory(category?: ExpenseCategory | null) {
  return category && categoryValues.includes(category) ? category : null;
}

function normalizeBudgetRecord(
  input: CreateBudgetInput | UpdateBudgetInput,
  fallback?: BudgetRecord,
): BudgetRecord {
  const type = resolveType(
    input as {
      type?: BudgetTypeValue | null;
      week?: number | null;
      category?: ExpenseCategory | null;
      categoryId?: string | null;
    },
  );
  const { periodStart, periodEnd } = resolvePeriod(input);
  const amountValue =
    typeof input.amount === "number" ? input.amount : fallback?.amount;
  const amountCentsValue =
    typeof input.amountCents === "number"
      ? input.amountCents
      : fallback?.amountCents;
  const amountCents = toCents(amountValue, amountCentsValue);
  const amount = toAmount(amountValue, amountCentsValue);
  const year = input.year ?? fallback?.year ?? periodStart.getUTCFullYear();
  const month = input.month ?? fallback?.month ?? periodStart.getUTCMonth() + 1;
  const week = input.week ?? fallback?.week ?? null;

  return {
    id: fallback?.id ?? input.localId ?? `budget_${Date.now()}`,
    localId: input.localId ?? fallback?.localId ?? `budget_local_${Date.now()}`,
    userId: fallback?.userId ?? "",
    type,
    categoryId: input.categoryId ?? fallback?.categoryId ?? null,
    year,
    month,
    week,
    category: normalizeCategory(input.category ?? fallback?.category),
    amount,
    amountCents,
    currency: (input.currency ?? fallback?.currency ?? "EUR").toUpperCase(),
    periodStart,
    periodEnd,
    isActive: input.isActive ?? fallback?.isActive ?? true,
    notes: input.notes ?? fallback?.notes ?? null,
    syncedAt: input.syncedAt
      ? new Date(input.syncedAt)
      : (fallback?.syncedAt ?? null),
    createdAt: fallback?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
}

async function assertBudgetOwner(userId: string, id: string) {
  const budget = await (prisma.budget as any).findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!budget) {
    throw new HttpError(404, "NOT_FOUND", "Budget not found");
  }
}

function budgetSummaryItem(record: BudgetRecord, spentAmount: number) {
  const budgetedAmount = Number(record.amount);
  return {
    ...serializeBudget(record),
    budgetedAmount,
    spentAmount,
    remaining: budgetedAmount - spentAmount,
    percentUsed:
      budgetedAmount > 0
        ? Math.min(100, (spentAmount / budgetedAmount) * 100)
        : 0,
  };
}

export class BudgetsService {
  static async getAllBudgets(userId: string) {
    const budgets = await (prisma.budget as any).findMany({
      where: { userId },
      orderBy: [{ periodStart: "desc" }, { updatedAt: "desc" }],
    });

    return budgets.map((budget: BudgetRecord) => serializeBudget(budget));
  }

  static async getBudget(id: string, userId: string) {
    const budget = await (prisma.budget as any).findFirst({
      where: { id, userId },
    });
    if (!budget) {
      throw new HttpError(404, "NOT_FOUND", "Budget not found");
    }

    return serializeBudget(budget as BudgetRecord);
  }

  static async getCurrentBudgets(userId: string) {
    const now = new Date();
    const budgets = await (prisma.budget as any).findMany({
      where: {
        userId,
        isActive: true,
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
      orderBy: [{ periodStart: "desc" }, { updatedAt: "desc" }],
    });

    return budgets.map((budget: BudgetRecord) => serializeBudget(budget));
  }

  static async createBudget(userId: string, data: CreateBudgetInput) {
    const record = normalizeBudgetRecord(data as UpdateBudgetInput);
    const created = await (prisma.budget as any).create({
      data: {
        ...record,
        userId,
      },
    });

    return serializeBudget(created as BudgetRecord);
  }

  static async updateBudget(
    id: string,
    userId: string,
    data: UpdateBudgetInput,
  ) {
    await assertBudgetOwner(userId, id);
    const current = await (prisma.budget as any).findFirst({
      where: { id, userId },
    });
    if (!current) {
      throw new HttpError(404, "NOT_FOUND", "Budget not found");
    }

    const next = normalizeBudgetRecord(data, current as BudgetRecord);
    const updated = await (prisma.budget as any).update({
      where: { id },
      data: {
        ...next,
        userId,
      },
    });

    return serializeBudget(updated as BudgetRecord);
  }

  static async deleteBudget(id: string, userId: string) {
    await assertBudgetOwner(userId, id);
    await (prisma.budget as any).delete({ where: { id } });
    return { id };
  }

  static async getBudgetSummary(userId: string, year: number, month?: number) {
    const targetMonth = month ?? new Date().getUTCMonth() + 1;
    const range = getMonthRange(year, targetMonth);
    const budgets = await (prisma.budget as any).findMany({
      where: {
        userId,
        periodStart: { lte: range.end },
        periodEnd: { gte: range.start },
      },
      orderBy: [{ periodStart: "asc" }, { updatedAt: "desc" }],
    });

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: range.start,
          lt: range.end,
        },
      },
    });

    return budgets.map((budget: BudgetRecord) => {
      const spent = expenses
        .filter(
          (expense) => !budget.category || expense.category === budget.category,
        )
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return budgetSummaryItem(budget, spent);
    });
  }

  static async syncBudgets(userId: string, input: BudgetSyncInput) {
    const results: Array<{
      localId?: string | null;
      id: string;
      status: string;
    }> = [];

    for (const item of input.budgets) {
      if (item.deleted) {
        const existing = item.id
          ? await (prisma.budget as any).findFirst({
              where: { id: item.id, userId },
              select: { id: true },
            })
          : item.localId
            ? await (prisma.budget as any).findFirst({
                where: { localId: item.localId, userId },
                select: { id: true },
              })
            : null;

        if (existing) {
          await (prisma.budget as any).delete({ where: { id: existing.id } });
        }

        results.push({
          localId: item.localId ?? null,
          id: item.id ?? existing?.id ?? item.localId ?? "",
          status: "deleted",
        });
        continue;
      }

      const existing = item.id
        ? await (prisma.budget as any).findFirst({
            where: { id: item.id, userId },
          })
        : item.localId
          ? await (prisma.budget as any).findFirst({
              where: { localId: item.localId, userId },
            })
          : null;

      const data = normalizeBudgetRecord(
        item as CreateBudgetInput,
        existing as BudgetRecord | undefined,
      );
      const saved = existing
        ? await (prisma.budget as any).update({
            where: { id: existing.id },
            data: { ...data, userId },
          })
        : await (prisma.budget as any).create({ data: { ...data, userId } });

      results.push({
        localId: item.localId ?? (saved as BudgetRecord).localId,
        id: (saved as BudgetRecord).id,
        status: existing ? "updated" : "created",
      });
    }

    return { results };
  }
}
