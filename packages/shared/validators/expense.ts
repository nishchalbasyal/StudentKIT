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

export type ExpenseInput = z.infer<typeof expenseSchema>;

