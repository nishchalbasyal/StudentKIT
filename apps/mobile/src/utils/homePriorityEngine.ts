import type { Dashboard } from "../types/dashboard.types";
import type { WorkSummary } from "../types/work.types";

export type FocusItemType =
  | "task"
  | "class"
  | "work"
  | "cleaning"
  | "grocery"
  | "budget"
  | "reminder"
  | "motivation";

export type TodayFocusItem = {
  id: string;
  type: FocusItemType;
  priority: number;
  title: string;
  subtitle: string;
  tone: "high" | "medium" | "low" | "calm";
};

function isSameDate(value: string | null | undefined, targetDate: string) {
  return Boolean(value?.startsWith(targetDate));
}

function isCleaningOverdue(task: Dashboard["cleaningReminders"][number]) {
  if (task.daysSinceLastDone === null || task.daysSinceLastDone === undefined) {
    return true;
  }

  return task.daysSinceLastDone >= task.intervalDays;
}

export function buildTodayFocusItems(
  data: Dashboard,
  workSummary?: WorkSummary | null,
  maxItems = 5
): TodayFocusItem[] {
  const today = data.date;
  const items: TodayFocusItem[] = [];

  for (const task of data.todayTasks) {
    if (task.status === "COMPLETED" || task.status === "CANCELLED") continue;

    items.push({
      id: `task-${task.id}`,
      type: "task",
      priority: task.priority === "HIGH" ? 100 : 94,
      title: task.title,
      subtitle: task.dueDate ? "Due today" : "Needs attention today",
      tone: task.priority === "HIGH" ? "high" : "medium"
    });
  }

  for (const classItem of data.todayClasses) {
    items.push({
      id: `class-${classItem.id}`,
      type: "class",
      priority: classItem.attendanceType === "MANDATORY" ? 90 : 74,
      title: classItem.courseName,
      subtitle:
        classItem.attendanceType === "MANDATORY"
          ? `Mandatory class at ${classItem.startTime}`
          : `Class at ${classItem.startTime}`,
      tone: classItem.attendanceType === "MANDATORY" ? "medium" : "calm"
    });
  }

  for (const shift of workSummary?.shifts ?? []) {
    if (!isSameDate(shift.date, today)) continue;

    items.push({
      id: `work-${shift.id}`,
      type: "work",
      priority: 82,
      title: shift.jobName,
      subtitle: `${shift.startTime} - ${shift.endTime} work shift`,
      tone: "calm"
    });
  }

  for (const cleaning of data.cleaningReminders) {
    if (!isCleaningOverdue(cleaning)) continue;

    items.push({
      id: `cleaning-${cleaning.id}`,
      type: "cleaning",
      priority: 72,
      title: cleaning.title,
      subtitle:
        cleaning.daysSinceLastDone === null || cleaning.daysSinceLastDone === undefined
          ? "Not completed yet"
          : `Last done ${cleaning.daysSinceLastDone} days ago`,
      tone: "medium"
    });
  }

  for (const item of data.pendingGroceries) {
    items.push({
      id: `grocery-${item.id}`,
      type: "grocery",
      priority: item.groceryItem?.isEssential ? 66 : 58,
      title: item.groceryItem?.name ?? "Grocery item",
      subtitle: `${item.quantity} waiting on your list`,
      tone: item.groceryItem?.isEssential ? "medium" : "calm"
    });
  }

  if (data.month.expenses > 0 && data.month.savings < 0) {
    items.push({
      id: "budget-warning",
      type: "budget",
      priority: 64,
      title: "Budget needs attention",
      subtitle: "Expenses are higher than income this month",
      tone: "high"
    });
  }

  for (const reminder of data.reminders) {
    items.push({
      id: `reminder-${reminder.id}`,
      type: "reminder",
      priority: 56,
      title: reminder.title,
      subtitle: reminder.message ?? "Reminder scheduled for today",
      tone: "calm"
    });
  }

  if (items.length === 0) {
    items.push({
      id: "motivation-calm-day",
      type: "motivation",
      priority: 1,
      title: "Your day is clear",
      subtitle: "A quiet day is still progress. Add anything you want the app to remember.",
      tone: "low"
    });
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, maxItems);
}
