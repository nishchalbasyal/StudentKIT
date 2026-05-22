import type { Dashboard } from "../../types/dashboard.types";
import type { WorkSummary } from "../../types/work.types";
import type { StudentFeedItem } from "../../utils/feedEngine";
import type { TodayFocusItem } from "../../utils/homePriorityEngine";
import type { HomeInsight } from "../../utils/insightFormatter";
import { formatCurrency } from "../../utils/formatCurrency";

export type SwipeCardType =
  | "today"
  | "work"
  | "expense"
  | "task"
  | "grocery"
  | "cleaning"
  | "ai"
  | "feed"
  | "goals";

export type SwipeMetric = {
  label: string;
  value: string;
};

export type SwipeDeckCard = {
  id: SwipeCardType;
  title: string;
  subtitle: string;
  metrics: SwipeMetric[];
  accentColor: string;
  leftAction: string;
  rightAction: string;
  upAction: string;
  downAction: string;
  suggestion: string;
  tip: string;
};

type BuildSwipeCardsInput = {
  dashboard: Dashboard;
  focusItems: TodayFocusItem[];
  workSummary?: WorkSummary | null;
  feed: StudentFeedItem[];
  insights: HomeInsight[];
  currency?: string;
};

export function buildSwipeDeckCards({
  dashboard,
  focusItems,
  workSummary,
  feed,
  insights,
  currency
}: BuildSwipeCardsInput): SwipeDeckCard[] {
  const topFocus = focusItems[0];
  const topCompany = workSummary?.companies?.[0];
  const groceryItem = dashboard.pendingGroceries[0]?.groceryItem?.name ?? "shopping list";
  const cleaningItem = dashboard.cleaningReminders[0]?.title ?? "routine";

  return [
    {
      id: "today",
      title: "Today Focus",
      subtitle: topFocus?.title ?? "Your day is clear",
      metrics: [
        { label: "Focus items", value: String(focusItems.length) },
        { label: "Reminders", value: String(dashboard.reminders.length) }
      ],
      accentColor: "#2563EB",
      leftAction: "Add task",
      rightAction: "Planner",
      upAction: "Insight",
      downAction: "Tip",
      suggestion: topFocus?.subtitle ?? "Add anything important so the app can remember it.",
      tip: "Start with one small action, then let the list shrink."
    },
    {
      id: "work",
      title: "Work Hours",
      subtitle: topCompany ? `${topCompany.companyName} leads this month` : "No shifts logged yet",
      metrics: [
        { label: "This month", value: `${workSummary?.totalHours ?? 0}h` },
        { label: "Income", value: formatCurrency(workSummary?.totalIncome ?? 0, currency) }
      ],
      accentColor: "#16A34A",
      leftAction: "Add shift",
      rightAction: "Details",
      upAction: "Work insight",
      downAction: "Work tip",
      suggestion:
        workSummary?.workLimit.usage.warningLevel === "ok"
          ? "Your work-limit status looks calm right now."
          : "Check your work-limit status before accepting extra shifts.",
      tip: "Logging shifts right after work keeps income tracking painless."
    },
    {
      id: "expense",
      title: "Expense",
      subtitle:
        dashboard.month.savings >= 0
          ? `${formatCurrency(dashboard.month.savings, currency)} saved this month`
          : "Spending is above income this month",
      metrics: [
        { label: "Income", value: formatCurrency(dashboard.month.income, currency) },
        { label: "Expenses", value: formatCurrency(dashboard.month.expenses, currency) }
      ],
      accentColor: "#2563EB",
      leftAction: "Add expense",
      rightAction: "Expense",
      upAction: "Expense insight",
      downAction: "Saving tip",
      suggestion:
        dashboard.month.expenses > 0
          ? "Small repeated purchases are usually where budgets leak."
          : "Add the first expense to make expense guidance useful.",
      tip: "Plan groceries before going to Aldi or Lidl."
    },
    {
      id: "task",
      title: "Tasks",
      subtitle:
        dashboard.todayTasks.length > 0
          ? `${dashboard.todayTasks.length} task${dashboard.todayTasks.length === 1 ? "" : "s"} due today`
          : "No tasks due today",
      metrics: [
        { label: "Today", value: String(dashboard.todayTasks.length) },
        { label: "Classes", value: String(dashboard.todayClasses.length) }
      ],
      accentColor: "#F97316",
      leftAction: "Add task",
      rightAction: "Tasks",
      upAction: "Study insight",
      downAction: "Study tip",
      suggestion: "Sort by deadline first, then by emotional weight.",
      tip: "A 10-minute start is enough to reduce task anxiety."
    },
    {
      id: "grocery",
      title: "Groceries",
      subtitle:
        dashboard.pendingGroceries.length > 0
          ? `${groceryItem} is waiting`
          : "Shopping list is clear",
      metrics: [
        { label: "Pending", value: String(dashboard.pendingGroceries.length) },
        { label: "Essentials", value: String(dashboard.pendingGroceries.filter((item) => item.groceryItem?.isEssential).length) }
      ],
      accentColor: "#0F766E",
      leftAction: "Add grocery",
      rightAction: "List",
      upAction: "Grocery insight",
      downAction: "Store tip",
      suggestion: "Items you buy often can become automatic reminders later.",
      tip: "Check essentials before leaving home."
    },
    {
      id: "cleaning",
      title: "Cleaning",
      subtitle:
        dashboard.cleaningReminders.length > 0
          ? `${cleaningItem} needs attention`
          : "No cleaning due",
      metrics: [
        { label: "Due", value: String(dashboard.cleaningReminders.length) },
        { label: "Routine", value: "weekly" }
      ],
      accentColor: "#7C3AED",
      leftAction: "Mark done",
      rightAction: "Cleaning",
      upAction: "Routine insight",
      downAction: "Reset tip",
      suggestion: "One completed routine can make the whole room feel lighter.",
      tip: "Attach cleaning to one fixed day so it stops taking mental space."
    },
    {
      id: "ai",
      title: "AI Suggestions",
      subtitle: insights[0]?.title ?? "Data-based suggestions",
      metrics: [
        { label: "Saved", value: String(insights.filter((insight) => insight.source === "cached-ai").length) },
        { label: "Local", value: String(insights.filter((insight) => insight.source === "local").length) }
      ],
      accentColor: "#4338CA",
      leftAction: "Ask AI",
      rightAction: "Open AI",
      upAction: "Show insight",
      downAction: "Daily note",
      suggestion: insights[0]?.message ?? "AI appears here after you generate an insight.",
      tip: "AI should support decisions, not become another inbox."
    },
    {
      id: "feed",
      title: "Student Feed",
      subtitle: feed[0]?.title ?? "Useful student notes",
      metrics: [
        { label: "Tips", value: String(feed.length) },
        { label: "Offers", value: String(feed.filter((item) => item.type === "offer").length) }
      ],
      accentColor: "#0891B2",
      leftAction: "Capture",
      rightAction: "More",
      upAction: "Useful tip",
      downAction: "Quote",
      suggestion: feed[0]?.message ?? "Student tips will appear here.",
      tip: feed.find((item) => item.type === "quote")?.message ?? "A calm plan beats a crowded mind."
    },
    {
      id: "goals",
      title: "Monthly Goals",
      subtitle: "Keep progress visible, not stressful",
      metrics: [
        { label: "Savings", value: formatCurrency(Math.max(dashboard.month.savings, 0), currency) },
        { label: "Work", value: `${workSummary?.totalHours ?? 0}h` }
      ],
      accentColor: "#0EA5E9",
      leftAction: "Add goal",
      rightAction: "Progress",
      upAction: "Goal insight",
      downAction: "Motivation",
      suggestion: "A visible goal reduces guessing and helps small choices matter.",
      tip: "Goals should guide you, not judge you."
    }
  ];
}
