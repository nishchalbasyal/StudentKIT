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

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "PAYPAL"
  | "OTHER";

export type Expense = {
  id: string;
  userId?: string | null;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  type?: "personal" | "split" | "group";
  paidBy?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseInput = {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  type?: "personal" | "split" | "group";
  paidBy?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string;
  note?: string;
};

export type ExpenseSummary = {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  monthlySavings: number;
  categoryTotals: Array<{ category: ExpenseCategory; total: number }>;
};

export type Budget = {
  id: string;
  localId?: string;
  userId?: string | null;
  type?: "WEEKLY" | "MONTHLY" | "CATEGORY" | "SAVINGS";
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
  notes: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
