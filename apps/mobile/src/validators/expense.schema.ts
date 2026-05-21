import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
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
  date: z.string().date("Use YYYY-MM-DD"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "PAYPAL", "OTHER"]).default("OTHER"),
  notes: z.string().trim().max(1000).optional()
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

