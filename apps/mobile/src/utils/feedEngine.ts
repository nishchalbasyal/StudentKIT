import type { Dashboard, AIInsight } from "../types/dashboard.types";
import type { WorkSummary } from "../types/work.types";

export type StudentFeedItem = {
  id: string;
  title: string;
  message: string;
  type: "quote" | "money" | "study" | "grocery" | "cleaning" | "offer" | "news" | "ai";
};

const quotes = [
  "Small progress daily is better than perfect planning.",
  "You do not need to remember everything when your system remembers it.",
  "A calm plan beats a crowded mind.",
  "Make the next useful action easy."
];

function pickStable<T>(items: T[], seed: string) {
  const code = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[code % items.length];
}

export function buildStudentFeed(
  data: Dashboard,
  workSummary?: WorkSummary | null,
  aiInsights: AIInsight[] = []
): StudentFeedItem[] {
  const feed: StudentFeedItem[] = [
    {
      id: "quote",
      title: "Today note",
      message: pickStable(quotes, data.date) ?? "A calm plan beats a crowded mind.",
      type: "quote"
    }
  ];

  if (data.month.expenses > 0) {
    feed.push({
      id: "money-tip",
      title: "Expense tip",
      message:
        data.month.savings >= 0
          ? "You are still in positive savings this month. Keep logging small expenses."
          : "Pause before small impulse buys today. Your monthly savings are below zero.",
      type: "money"
    });
  }

  if (data.todayTasks.length > 0) {
    feed.push({
      id: "study-tip",
      title: "Study tip",
      message: "Start with the task that has the nearest deadline, then make the next step tiny.",
      type: "study"
    });
  }

  if (data.pendingGroceries.length > 0) {
    feed.push({
      id: "grocery-tip",
      title: "Grocery tip",
      message: "Check the list before visiting Aldi, Lidl, or Rewe so small repeats do not stack up.",
      type: "grocery"
    });
  }

  if (data.cleaningReminders.length > 0) {
    feed.push({
      id: "cleaning-tip",
      title: "Routine tip",
      message: "Cleaning is easier when it is attached to one fixed weekly moment.",
      type: "cleaning"
    });
  }

  if ((workSummary?.totalHours ?? 0) > 0) {
    feed.push({
      id: "work-tip",
      title: "Work rhythm",
      message: `${workSummary?.totalHours ?? 0}h logged this month. Check work limits before accepting extra shifts.`,
      type: "money"
    });
  }

  if (aiInsights[0]) {
    feed.push({
      id: `ai-${aiInsights[0].id}`,
      title: "Saved AI insight",
      message: aiInsights[0].content,
      type: "ai"
    });
  }

  feed.push({
    id: "offer-placeholder",
    title: "Student offer",
    message: "Student discounts and local coupons can live here when a trusted source is connected.",
    type: "offer"
  });

  feed.push({
    id: "news-placeholder",
    title: "Student news",
    message: "University events, visa reminders, and city updates can appear here later.",
    type: "news"
  });

  return feed.slice(0, 6);
}
