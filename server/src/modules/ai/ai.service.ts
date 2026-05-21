import { createHash } from "node:crypto";
import type { AIInsightType, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { getMonthRange, getWeekRange, toDateOnlyString } from "../../utils/date.js";
import { getMonthlyExpenseSummary } from "../expenses/expenses.service.js";
import { getWeeklyWorkSummary, getWorkLimitForYear } from "../work-hours/workHours.service.js";
import { createAIProvider } from "./providers.js";
import type { StudyPlanInput } from "./ai.schemas.js";

const provider = createAIProvider();

export async function getLatestAIInsights(userId: string, limit = 3) {
  return prisma.aIInsight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 5)
  });
}

export async function generateExpenseAdvice(userId: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const summary = await getMonthlyExpenseSummary(userId, { year, month });

  return generateAndStoreInsight(userId, "EXPENSE_ADVICE", summary, [
    "You are a simple budgeting assistant for an international student in Germany.",
    "Use only the numbers in the data below.",
    "If data is missing, say what is missing.",
    "Give 3 to 5 short, realistic cost-saving suggestions in simple English.",
    JSON.stringify(summary)
  ].join("\n"));
}

export async function generateWeeklySummary(userId: string) {
  const today = new Date();
  const { start, end } = getWeekRange(today);
  const [work, tasks, reminders] = await Promise.all([
    getWeeklyWorkSummary(userId, { date: toDateOnlyString(today) }),
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueDate: { gte: start, lt: end }
      },
      orderBy: { dueDate: "asc" },
      take: 20
    }),
    prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
        scheduledAt: { gte: start, lt: end }
      },
      orderBy: { scheduledAt: "asc" },
      take: 20
    })
  ]);
  const summary = { weekStart: toDateOnlyString(start), weekEnd: toDateOnlyString(end), work, tasks, reminders };

  return generateAndStoreInsight(userId, "WEEKLY_SUMMARY", summary, [
    "Summarize this student's week in simple English.",
    "Use only the provided data. Do not invent classes, tasks, money, or hours.",
    "Mention missing data if there is not enough information.",
    "Return a short checklist-style summary.",
    JSON.stringify(summary)
  ].join("\n"));
}

export async function suggestGrocerySavings(userId: string) {
  const items = await prisma.groceryItem.findMany({
    where: { userId },
    include: {
      purchases: {
        orderBy: { purchaseDate: "desc" },
        take: 5
      }
    },
    take: 30
  });
  const summary = items.map((item) => ({
    name: item.name,
    category: item.category,
    isEssential: item.isEssential,
    recentPurchases: item.purchases.map((purchase) => ({
      storeName: purchase.storeName,
      price: Number(purchase.price),
      quantity: purchase.quantity,
      purchaseDate: toDateOnlyString(purchase.purchaseDate)
    }))
  }));

  return generateAndStoreInsight(userId, "GROCERY_ADVICE", summary, [
    "Suggest grocery savings for a student in Germany.",
    "Use only the provided price history. Do not invent prices or stores.",
    "If price history is missing, say that more purchases are needed.",
    "Give short, practical suggestions.",
    JSON.stringify(summary)
  ].join("\n"));
}

export async function suggestStudyPlan(userId: string, input: StudyPlanInput) {
  const now = new Date();
  const { end } = getWeekRange(now);
  const [classes, tasks] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        OR: [{ dueDate: { gte: now, lt: end } }, { dueDate: null }]
      },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
      take: 30
    })
  ]);
  const summary = {
    availableHoursThisWeek: input.availableHoursThisWeek ?? null,
    classes,
    tasks
  };

  return generateAndStoreInsight(userId, "STUDY_PLAN", summary, [
    "Create a simple study plan for this week.",
    "Use only the provided class and task data.",
    "Do not invent deadlines or class times.",
    "If available study hours are missing, make a general priority suggestion.",
    JSON.stringify(summary)
  ].join("\n"));
}

export async function suggestWorkLimitWarning(userId: string) {
  const year = new Date().getUTCFullYear();
  const summary = await getWorkLimitForYear(userId, year);

  return generateAndStoreInsight(userId, "WORK_LIMIT_WARNING", summary, [
    "Explain this student's work-limit status in simple English.",
    "Use only the provided work-limit usage data.",
    "Do not provide legal advice. Say this is planning guidance.",
    "If the student is near or over the limit, suggest safe next steps like checking university guidance.",
    JSON.stringify(summary)
  ].join("\n"));
}

async function generateAndStoreInsight(
  userId: string,
  type: AIInsightType,
  inputSummary: Prisma.InputJsonValue,
  prompt: string
) {
  const promptHash = createHash("sha256").update(prompt).digest("hex");
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const cached = await prisma.aIInsight.findFirst({
    where: {
      userId,
      type,
      promptHash,
      createdAt: { gte: startOfToday }
    },
    orderBy: { createdAt: "desc" }
  });

  if (cached) {
    return cached;
  }

  const content = await provider.generateSuggestion(prompt);

  return prisma.aIInsight.create({
    data: {
      userId,
      type,
      provider: provider.name,
      model: provider.model,
      promptHash,
      inputSummary,
      content
    }
  });
}
