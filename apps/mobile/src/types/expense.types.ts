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

export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "PAYPAL" | "OTHER";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
};

export type ExpenseInput = {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
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
  year: number;
  month: number;
  category?: ExpenseCategory | null;
  amount: number;
  notes?: string | null;
};

