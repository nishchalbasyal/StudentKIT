import type { Expense, ExpenseCategory, PaymentMethod } from "../types/expense.types";
import type { WorkShift } from "../types/work.types";
import type { StudentTask } from "../types/task.types";

export type Suggestion = {
  label: string;
  value: string | number;
  helper?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function mostCommon<T extends string | number>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);
}

export function getExpenseTitleSuggestions(input: string, expenses: Expense[] = []): Suggestion[] {
  const query = normalize(input);
  const titles = unique(expenses.map((expense) => expense.title).filter(Boolean));
  return titles
    .filter((title) => !query || normalize(title).includes(query))
    .slice(0, 5)
    .map((title) => ({ label: title, value: title }));
}

export function getExpenseAmountSuggestions(input: string, expenses: Expense[] = []): Suggestion[] {
  const query = normalize(input);
  const matched = expenses.filter((expense) => !query || normalize(expense.title).includes(query));
  const amounts = mostCommon(matched.map((expense) => expense.amount)).slice(0, 4);
  return amounts.map((amount) => ({ label: `EUR ${amount.toFixed(2)}`, value: amount }));
}

export function getExpenseCategorySuggestion(input: string, expenses: Expense[] = []): ExpenseCategory | null {
  const query = normalize(input);
  const matched = expenses.filter((expense) => query && normalize(expense.title).includes(query));
  return mostCommon(matched.map((expense) => expense.category))[0] ?? null;
}

export function getPaymentSuggestions(expenses: Expense[] = []): Suggestion[] {
  const methods = mostCommon(expenses.map((expense) => expense.paymentMethod)).slice(0, 4);
  const fallback: PaymentMethod[] = ["CARD", "CASH", "PAYPAL"];
  return (methods.length ? methods : fallback).map((method) => ({
    label: method.toLowerCase().replace("_", " "),
    value: method
  }));
}

export function getCompanySuggestions(workShifts: WorkShift[] = []): Suggestion[] {
  return unique(workShifts.map((shift) => shift.jobName).filter(Boolean))
    .slice(0, 5)
    .map((company) => ({ label: company, value: company }));
}

export function getWageSuggestion(company: string, workShifts: WorkShift[] = []): number | null {
  const matched = workShifts.filter((shift) => normalize(shift.jobName) === normalize(company));
  return mostCommon(matched.map((shift) => shift.hourlyWage))[0] ?? null;
}

export function getBreakSuggestion(company: string, workShifts: WorkShift[] = []): number | null {
  const matched = workShifts.filter((shift) => normalize(shift.jobName) === normalize(company));
  return mostCommon(matched.map((shift) => shift.breakMinutes))[0] ?? null;
}

export function getShiftTimeSuggestion(company: string, workShifts: WorkShift[] = []) {
  const matched = workShifts.filter((shift) => normalize(shift.jobName) === normalize(company));
  const latest = matched[0];
  return latest ? { startTime: latest.startTime, endTime: latest.endTime } : null;
}

export function getTaskTitleSuggestions(input: string, tasks: StudentTask[] = []): Suggestion[] {
  const query = normalize(input);
  return unique(tasks.map((task) => task.title))
    .filter((title) => !query || normalize(title).includes(query))
    .slice(0, 5)
    .map((title) => ({ label: title, value: title }));
}
