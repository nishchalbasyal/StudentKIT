import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().trim().min(1).max(140),
  amount: z.coerce.number().positive().max(100000),
  category: z.enum([
    "GROCERIES",
    "RENT",
    "TRANSPORT",
    "FOOD",
    "STUDY",
    "HEALTH",
    "ENTERTAINMENT",
    "BILLS",
    "SHOPPING",
    "OTHER"
  ]),
  date: z.string().date(),
  paymentMethod: z
    .enum(["CASH", "CARD", "BANK_TRANSFER", "PAYPAL", "OTHER"])
    .default("OTHER"),
  notes: z.string().trim().max(1000).optional()
});

export const updateExpenseSchema = expenseSchema.partial();

export const monthlyExpenseQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export const categorySummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

export const budgetSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  category: expenseSchema.shape.category.nullable().optional(),
  amount: z.coerce.number().positive().max(100000),
  notes: z.string().trim().max(1000).optional()
});

export const updateBudgetSchema = budgetSchema.partial();

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type MonthlyExpenseQuery = z.infer<typeof monthlyExpenseQuerySchema>;
export type CategorySummaryQuery = z.infer<typeof categorySummaryQuerySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

