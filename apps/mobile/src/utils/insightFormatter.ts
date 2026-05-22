import type { Dashboard, AIInsight } from "../types/dashboard.types";
import type { WorkSummary } from "../types/work.types";
import { formatCurrency } from "./formatCurrency";

export type HomeInsight = {
  id: string;
  title: string;
  message: string;
  source: "cached-ai" | "local";
};

export function buildHomeInsights(
  data: Dashboard,
  workSummary?: WorkSummary | null,
  cachedInsights: AIInsight[] = [],
  currency?: string
): HomeInsight[] {
  const insights: HomeInsight[] = cachedInsights.slice(0, 2).map((insight) => ({
    id: insight.id,
    title: insight.type.replaceAll("_", " ").toLowerCase(),
    message: insight.content,
    source: "cached-ai"
  }));

  if (data.month.expenses > 0) {
    insights.push({
      id: "local-savings",
      title: "Expense check",
      message:
        data.month.savings >= 0
          ? `You have ${formatCurrency(data.month.savings, currency)} left after expenses this month.`
          : `You are ${formatCurrency(Math.abs(data.month.savings), currency)} below break-even this month.`,
      source: "local"
    });
  }

  const workLimit = workSummary?.workLimit.usage;
  if (workLimit && workLimit.warningLevel !== "ok") {
    insights.push({
      id: "local-work-limit",
      title: "Work limit",
      message: `You have used ${workLimit.usedFullDayUnits}/${workLimit.limitFullDayUnits} work day units. Treat this as planning guidance.`,
      source: "local"
    });
  }

  if (data.cleaningReminders.length > 0) {
    insights.push({
      id: "local-cleaning",
      title: "Routine memory",
      message: `${data.cleaningReminders.length} cleaning routine needs attention soon.`,
      source: "local"
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "local-calm",
      title: "Calm day",
      message: "Nothing urgent is standing out. Add anything you want Student Kit to remember for you.",
      source: "local"
    });
  }

  return insights.slice(0, 4);
}
