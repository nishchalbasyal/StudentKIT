import { prisma } from "../../database/prisma.js";
import { getMonthRange, parseDateOnly, toDateOnlyString } from "../../utils/date.js";
import { getTodayClasses } from "../classes/classes.service.js";
import { getMonthlyExpenseSummary } from "../expenses/expenses.service.js";
import { getMonthlyWorkSummary } from "../work-hours/workHours.service.js";

export async function getDashboard(userId: string) {
  const today = new Date();
  const todayString = toDateOnlyString(today);
  const todayStart = parseDateOnly(todayString);
  const tomorrow = new Date(todayStart);
  tomorrow.setUTCDate(todayStart.getUTCDate() + 1);
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  const { start: monthStart, end: monthEnd } = getMonthRange(year, month);

  const [work, expenses, todayClasses, todayTasks, pendingGroceries, cleaningReminders, reminders] =
    await Promise.all([
      getMonthlyWorkSummary(userId, { year, month }),
      getMonthlyExpenseSummary(userId, { year, month }),
      getTodayClasses(userId, today),
      prisma.task.findMany({
        where: {
          userId,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { gte: todayStart, lt: tomorrow }
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 10
      }),
      prisma.shoppingListItem.findMany({
        where: { userId, status: "PENDING" },
        include: { groceryItem: true },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      prisma.cleaningTask.findMany({
        where: {
          userId,
          OR: [{ nextReminderAt: { lte: tomorrow } }, { nextReminderAt: null }]
        },
        orderBy: [{ nextReminderAt: "asc" }, { title: "asc" }],
        take: 10
      }),
      prisma.reminder.findMany({
        where: {
          userId,
          isCompleted: false,
          scheduledAt: { gte: todayStart, lt: tomorrow }
        },
        orderBy: { scheduledAt: "asc" },
        take: 10
      })
    ]);

  return {
    date: todayString,
    month: {
      year,
      month,
      range: {
        start: toDateOnlyString(monthStart),
        end: toDateOnlyString(monthEnd)
      },
      income: work.totalIncome,
      expenses: expenses.totalExpenses,
      savings: expenses.monthlySavings
    },
    workLimitWarning: work.workLimit.usage,
    todayClasses,
    todayTasks,
    pendingGroceries,
    cleaningReminders,
    reminders
  };
}

