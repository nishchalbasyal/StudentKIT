import { z } from "zod";

const budgetTypeSchema = z.enum(["WEEKLY", "MONTHLY", "CATEGORY", "SAVINGS"]);
const expenseCategorySchema = z.enum([
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
]);

const budgetBaseSchema = z.object({
  localId: z.string().trim().min(1).max(160).optional(),
  type: budgetTypeSchema.optional(),
  categoryId: z.string().trim().min(1).max(160).nullable().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  week: z.coerce.number().int().min(1).max(53).optional(),
  category: expenseCategorySchema.optional().nullable(),
  amount: z.coerce
    .number()
    .positive("Budget amount must be positive")
    .optional(),
  amountCents: z.coerce.number().int().min(1).optional(),
  currency: z.string().trim().length(3).optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  syncedAt: z.string().datetime().nullable().optional(),
});

export const createBudgetSchema = budgetBaseSchema.refine(
  (data) => data.amount !== undefined || data.amountCents !== undefined,
  {
    message: "Budget amount is required",
    path: ["amount"],
  },
);

export const updateBudgetSchema = budgetBaseSchema;

export const budgetSummaryQuerySchema = z
  .union([
    z.object({
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    }),
    z.object({
      year: z.coerce.number().int().min(2000).max(2100),
      month: z.coerce.number().int().min(1).max(12).optional(),
    }),
  ])
  .transform((value) => {
    if (typeof value.month === "string") {
      const [year, month] = value.month.split("-").map(Number);
      return { year: year!, month: month! };
    }

    return value;
  });

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetSummaryQuery = z.infer<typeof budgetSummaryQuerySchema>;

export const budgetSyncSchema = z.object({
  budgets: z
    .array(
      budgetBaseSchema.extend({
        id: z.string().trim().min(1).optional(),
        deleted: z.boolean().optional(),
      }),
    )
    .default([]),
});

export type BudgetSyncInput = z.infer<typeof budgetSyncSchema>;
