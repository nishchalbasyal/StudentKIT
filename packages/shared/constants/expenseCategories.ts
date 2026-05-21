export const EXPENSE_CATEGORIES = [
  "groceries",
  "rent",
  "transport",
  "food",
  "study",
  "health",
  "entertainment",
  "bills",
  "shopping",
  "other"
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number];

