import type { Priority } from "./class.types";

export type TaskType = "HOMEWORK" | "ASSIGNMENT" | "EXAM" | "PERSONAL" | "WORK" | "OTHER";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type StudentTask = {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  dueDate?: string | null;
  priority: Priority;
  status: TaskStatus;
  reminderAt?: string | null;
  calendarSyncEnabled?: boolean;
  calendarEventId?: string | null;
  linkedClassId?: string | null;
};

export type TaskInput = {
  title: string;
  description?: string;
  type: TaskType;
  dueDate?: string;
  priority: Priority;
  reminderAt?: string;
  calendarSyncEnabled?: boolean;
  calendarEventId?: string;
  linkedClassId?: string;
};
