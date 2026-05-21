import { z } from "zod";

const taskBaseSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(["HOMEWORK", "ASSIGNMENT", "EXAM", "PERSONAL", "WORK", "OTHER"]).default("OTHER"),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("TODO"),
  reminderAt: z.string().datetime().optional(),
  calendarSyncEnabled: z.coerce.boolean().default(false),
  calendarEventId: z.string().max(255).optional().nullable(),
  linkedClassId: z.string().min(1).optional()
});

function reminderBeforeDueDate(data: { dueDate?: string; reminderAt?: string }) {
  if (!data.dueDate || !data.reminderAt) return true;
  return new Date(data.reminderAt).getTime() <= new Date(data.dueDate).getTime();
}

export const taskSchema = taskBaseSchema.refine(reminderBeforeDueDate, {
  path: ["reminderAt"],
  message: "Reminder cannot be after due date"
});

export const updateTaskSchema = taskBaseSchema.partial().refine(reminderBeforeDueDate, {
  path: ["reminderAt"],
  message: "Reminder cannot be after due date"
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
