export const EXPENSE_CATEGORIES = [
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
] as const;

export const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "PAYPAL", "OTHER"] as const;

export const BONUS_TYPES = ["NONE", "DOUBLE", "PERCENTAGE", "FIXED", "NIGHT_SHIFT", "CUSTOM"] as const;

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
