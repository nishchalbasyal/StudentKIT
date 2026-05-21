import type { ClassSchedule } from "./class.types";
import type { CleaningTask } from "./cleaning.types";
import type { ShoppingListItem } from "./grocery.types";
import type { Reminder } from "./reminder.types";
import type { StudentTask } from "./task.types";
import type { WorkLimitUsage } from "./work.types";

export type Dashboard = {
  date: string;
  month: {
    year: number;
    month: number;
    income: number;
    expenses: number;
    savings: number;
  };
  workLimitWarning: WorkLimitUsage;
  todayClasses: ClassSchedule[];
  todayTasks: StudentTask[];
  pendingGroceries: ShoppingListItem[];
  cleaningReminders: CleaningTask[];
  reminders: Reminder[];
};

export type AIInsight = {
  id: string;
  type: string;
  provider: string;
  model?: string | null;
  content: string;
  createdAt: string;
};

