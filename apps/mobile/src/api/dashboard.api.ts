import type { Dashboard } from "../types/dashboard.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { useAuthStore } from "../store/authStore";

export async function getDashboardApi() {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<Dashboard>(await apiClient.get("/dashboard"));
    } catch {
      // Local fallback below.
    }
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const [tasks, expenses, workEntries, shoppingList, cleaningReminders, reminders] =
    await Promise.all([
      localDb.list("tasks"),
      localDb.list("expenses"),
      localDb.list("workEntries"),
      localDb.list("shoppingList"),
      localDb.list("cleaningRoutines"),
      localDb.list("reminders"),
    ]);
  const monthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthWork = workEntries.filter((shift) => {
    const date = new Date(`${shift.date}T12:00:00`);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const income = monthWork.reduce((sum, shift) => sum + Number(shift.calculatedIncome ?? 0), 0);
  const expenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    date: today,
    month: {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      income,
      expenses: expenseTotal,
      savings: income - expenseTotal,
    },
    workLimitWarning: {
      usedFullDayUnits: workEntries.length,
      remainingFullDayUnits: Math.max(0, 140 - workEntries.length),
      limitFullDayUnits: 140,
      percentUsed: Math.min(100, (workEntries.length / 140) * 100),
      warningLevel: "ok",
    },
    todayClasses: [],
    todayTasks: tasks.filter((task) => task.dueDate?.startsWith(today)),
    pendingGroceries: shoppingList.filter((item) => item.status === "PENDING"),
    cleaningReminders,
    reminders: reminders.filter((reminder) => !reminder.isCompleted),
  } satisfies Dashboard;
}
