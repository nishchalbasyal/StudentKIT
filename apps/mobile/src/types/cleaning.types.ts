export type CleaningTask = {
  id: string;
  title: string;
  intervalDays: number;
  lastCompletedAt?: string | null;
  nextReminderAt?: string | null;
  daysSinceLastDone?: number | null;
  notes?: string | null;
};

export type CleaningTaskInput = {
  title: string;
  intervalDays: number;
  notes?: string;
};

