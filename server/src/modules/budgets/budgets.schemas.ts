import { z } from "zod";

export const createBudgetSchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
    week: z.coerce.number().int().min(1).max(53).optional(),
    category: z
      .enum([
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
      ])
      .optional()
      .nullable(),
    amount: z.coerce.number().positive("Budget amount must be positive"),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine((data) => data.month || data.week, {
    message: "Either month or week must be specified",
    path: ["month"],
  });

export const updateBudgetSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  week: z.coerce.number().int().min(1).max(53).optional(),
  category: z
    .enum([
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
    ])
    .optional()
    .nullable(),
  amount: z.coerce
    .number()
    .positive("Budget amount must be positive")
    .optional(),
  notes: z.string().max(1000).optional().nullable(),
});

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
