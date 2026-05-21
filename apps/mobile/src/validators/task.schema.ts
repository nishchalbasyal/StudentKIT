import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(["HOMEWORK", "ASSIGNMENT", "EXAM", "PERSONAL", "WORK", "OTHER"]).default("OTHER"),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  reminderAt: z.string().datetime().optional(),
  calendarSyncEnabled: z.boolean().default(false),
  calendarEventId: z.string().optional(),
  linkedClassId: z.string().optional()
}).refine((value) => {
  if (!value.dueDate || !value.reminderAt) return true;
  return new Date(value.reminderAt).getTime() <= new Date(value.dueDate).getTime();
}, { path: ["reminderAt"], message: "Reminder cannot be after due date" });

export type TaskFormValues = z.infer<typeof taskSchema>;
