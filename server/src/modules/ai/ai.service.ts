import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type { StudyPlanInput } from "./ai.schemas.js";

function comingSoonInsight(type = "COMING_SOON") {
  return {
    id: `ai-coming-soon-${type}`,
    type,
    provider: "disabled",
    model: null,
    content:
      "AI features are coming soon. Manual tools are free and available now.",
    createdAt: new Date().toISOString(),
  };
}

export async function getAIStatus(userId: string) {
  const access = await prisma.aIAccess
    .findUnique({ where: { userId } })
    .catch(() => null);

  return {
    comingSoon: true,
    enabled: false,
    message:
      "AI features are coming soon. Manual tools are free and available now.",
    access: access
      ? {
          plan: access.plan,
          monthlyLimit: access.monthlyLimit,
          usedThisMonth: access.usedThisMonth,
          resetDate: access.resetDate,
        }
      : {
          plan: "FREE",
          monthlyLimit: 0,
          usedThisMonth: 0,
          resetDate: new Date().toISOString(),
        },
  };
}

export async function requestAIResponse(_userId: string, _input: unknown) {
  throw new HttpError(
    503,
    "AI_PROVIDER_ERROR",
    "AI features are coming soon. Manual tools are free and available now.",
  );
}

export async function getLatestAIInsights(_userId: string, limit = 3) {
  return Array.from({ length: Math.max(1, Math.min(limit, 3)) }, () =>
    comingSoonInsight(),
  );
}

export async function generateExpenseAdvice(_userId: string) {
  return comingSoonInsight("EXPENSE_ADVICE");
}

export async function generateWeeklySummary(_userId: string) {
  return comingSoonInsight("WEEKLY_SUMMARY");
}

export async function suggestGrocerySavings(_userId: string) {
  return comingSoonInsight("GROCERY_ADVICE");
}

export async function suggestStudyPlan(
  _userId: string,
  _input: StudyPlanInput,
) {
  return comingSoonInsight("STUDY_PLAN");
}

export async function suggestWorkLimitWarning(_userId: string) {
  return comingSoonInsight("WORK_LIMIT_WARNING");
}
