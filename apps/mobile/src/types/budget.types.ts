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

export type BudgetType = "WEEKLY" | "MONTHLY" | "CATEGORY" | "SAVINGS";

export interface Budget {
  id: string;
  localId?: string;
  userId?: string | null;
  type?: BudgetType;
  categoryId?: string | null;
  year: number;
  month: number;
  week?: number | null;
  category?: ExpenseCategory | null;
  amount: number;
  amountCents?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  isActive?: boolean;
  notes: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  localId?: string;
  type?: BudgetType;
  categoryId?: string | null;
  year?: number;
  month?: number;
  week?: number | null;
  category?: ExpenseCategory | null;
  amount: number;
  amountCents?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  isActive?: boolean;
  notes?: string | null;
}

export interface BudgetSummary {
  id: string;
  localId?: string;
  type?: BudgetType;
  categoryId?: string | null;
  year: number;
  month: number;
  category?: ExpenseCategory | null;
  amount: number;
  amountCents?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  isActive?: boolean;
  notes?: string | null;
  budgetedAmount: number;
  spentAmount: number;
  remaining: number;
  percentUsed: number;
}
