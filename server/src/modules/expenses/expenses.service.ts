import type { Budget, Expense, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { getMonthRange, parseDateOnly, toDateOnlyString } from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import { getMonthlyIncome } from "../work-hours/workHours.service.js";
import { roundMoney } from "../work-hours/workHours.calculations.js";
import type {
  BudgetInput,
  CategorySummaryQuery,
  ExpenseInput,
  MonthlyExpenseQuery,
  UpdateBudgetInput,
  UpdateExpenseInput
} from "./expenses.schemas.js";

function mapExpense(expense: Expense) {
  return {
    ...expense,
    amount: Number(expense.amount),
    date: toDateOnlyString(expense.date)
  };
}

function mapBudget(budget: Budget) {
  return {
    ...budget,
    amount: Number(budget.amount)
  };
}

function expenseInputToData(input: ExpenseInput | UpdateExpenseInput) {
  const data: Prisma.ExpenseUncheckedCreateInput | Prisma.ExpenseUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.category !== undefined) data.category = input.category;
  if (input.date !== undefined) data.date = parseDateOnly(input.date);
  if (input.type !== undefined) (data as Record<string, unknown>).type = input.type;
  if (input.paidBy !== undefined) (data as Record<string, unknown>).paidBy = input.paidBy;
  if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
  if (input.notes !== undefined || input.note !== undefined) data.notes = input.notes ?? input.note;

  return data;
}

function budgetInputToData(input: BudgetInput | UpdateBudgetInput) {
  const data: Prisma.BudgetUncheckedCreateInput | Prisma.BudgetUncheckedUpdateInput = {};

  if (input.year !== undefined) data.year = input.year;
  if (input.month !== undefined) data.month = input.month;
  if (input.category !== undefined) data.category = input.category;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.notes !== undefined) data.notes = input.notes;

  return data;
}

export async function listExpenses(userId: string) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  return expenses.map(mapExpense);
}

export async function createExpense(userId: string, input: ExpenseInput) {
  const expense = await prisma.expense.create({
    data: {
      ...expenseInputToData(input),
      userId
    } as Prisma.ExpenseUncheckedCreateInput
  });

  return mapExpense(expense);
}

export async function updateExpense(userId: string, id: string, input: UpdateExpenseInput) {
  await assertExpenseOwner(userId, id);
  const expense = await prisma.expense.update({
    where: { id },
    data: expenseInputToData(input)
  });

  return mapExpense(expense);
}

export async function deleteExpense(userId: string, id: string) {
  await assertExpenseOwner(userId, id);
  await prisma.expense.delete({ where: { id } });

  return { id };
}

export async function getMonthlyExpenseSummary(userId: string, query: MonthlyExpenseQuery) {
  const { start, end } = getMonthRange(query.year, query.month);
  const [expenses, budgets, totalIncome] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end
        }
      }
    }),
    prisma.budget.findMany({
      where: {
        userId,
        year: query.year,
        month: query.month
      },
      orderBy: [{ category: "asc" }]
    }),
    getMonthlyIncome(userId, query.year, query.month)
  ]);

  const totalExpenses = roundMoney(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0));
  const categoryTotals = buildCategoryTotals(expenses);

  return {
    year: query.year,
    month: query.month,
    totalIncome,
    totalExpenses,
    monthlySavings: roundMoney(totalIncome - totalExpenses),
    categoryTotals,
    budgets: budgets.map(mapBudget)
  };
}

export async function getCategorySpending(userId: string, query: CategorySummaryQuery) {
  const where: Prisma.ExpenseWhereInput = { userId };

  if (query.year && query.month) {
    const { start, end } = getMonthRange(query.year, query.month);
    where.date = { gte: start, lt: end };
  }

  const expenses = await prisma.expense.findMany({ where });

  return buildCategoryTotals(expenses);
}

export async function listBudgets(userId: string, query?: Partial<MonthlyExpenseQuery>) {
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      year: query?.year,
      month: query?.month
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }]
  });

  return budgets.map(mapBudget);
}

export async function createBudget(userId: string, input: BudgetInput) {
  const budget = await prisma.budget.create({
    data: {
      ...budgetInputToData(input),
      userId
    } as Prisma.BudgetUncheckedCreateInput
  });

  return mapBudget(budget);
}

export async function updateBudget(userId: string, id: string, input: UpdateBudgetInput) {
  await assertBudgetOwner(userId, id);
  const budget = await prisma.budget.update({
    where: { id },
    data: budgetInputToData(input)
  });

  return mapBudget(budget);
}

export async function deleteBudget(userId: string, id: string) {
  await assertBudgetOwner(userId, id);
  await prisma.budget.delete({ where: { id } });

  return { id };
}

function buildCategoryTotals(expenses: Expense[]) {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    totals.set(expense.category, roundMoney((totals.get(expense.category) ?? 0) + Number(expense.amount)));
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => right.total - left.total);
}

async function assertExpenseOwner(userId: string, id: string) {
  const expense = await prisma.expense.findFirst({ where: { id, userId }, select: { id: true } });

  if (!expense) {
    throw new HttpError(404, "NOT_FOUND", "Expense not found");
  }
}

async function assertBudgetOwner(userId: string, id: string) {
  const budget = await prisma.budget.findFirst({ where: { id, userId }, select: { id: true } });

  if (!budget) {
    throw new HttpError(404, "NOT_FOUND", "Budget not found");
  }
}
