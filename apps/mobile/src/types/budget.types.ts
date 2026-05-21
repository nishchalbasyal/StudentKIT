export type ExpenseCategory =
  | "GROCERIES"
  | "RENT"
  | "TRANSPORT"
  | "FOOD"
  | "STUDY"
  | "HEALTH"
  | "ENTERTAINMENT"
  | "BILLS"
  | "SHOPPING"
  | "OTHER";

export interface Budget {
  id: string;
  userId: string;
  year: number;
  month: number;
  week?: number | null;
  category: ExpenseCategory | null;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  year: number;
  month: number;
  week?: number | null;
  category?: ExpenseCategory | null;
  amount: number;
  notes?: string | null;
}

export interface BudgetSummary {
  id: string;
  year: number;
  month: number;
  category: ExpenseCategory | null;
  budgetedAmount: number;
  spentAmount: number;
  remaining: number;
  percentUsed: number;
}
