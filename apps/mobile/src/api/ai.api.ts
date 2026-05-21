import type { AIInsight } from "../types/dashboard.types";

function comingSoonInsight(type = "COMING_SOON"): AIInsight {
  return {
    id: `ai-coming-soon-${type}`,
    type,
    provider: "disabled",
    model: null,
    content:
      "AI features are coming soon. You can use all core StudentKit features manually for free.",
    createdAt: new Date().toISOString(),
  };
}

export async function getLatestAIInsightsApi(limit = 3) {
  return Array.from({ length: Math.min(limit, 1) }, () => comingSoonInsight());
}

export async function generateExpenseAdviceApi() {
  return comingSoonInsight("EXPENSE_ADVICE");
}

export async function generateWeeklySummaryApi() {
  return comingSoonInsight("WEEKLY_SUMMARY");
}

export async function generateGroceryAdviceApi() {
  return comingSoonInsight("GROCERY_ADVICE");
}

export async function generateStudyPlanApi(input: { availableHoursThisWeek?: number }) {
  void input;
  return comingSoonInsight("STUDY_PLAN");
}

export async function generateWorkLimitWarningApi() {
  return comingSoonInsight("WORK_LIMIT_WARNING");
}
