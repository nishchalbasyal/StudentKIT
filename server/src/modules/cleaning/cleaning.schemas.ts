import { z } from "zod";

export const cleaningTaskSchema = z.object({
  title: z.string().trim().min(1).max(140),
  intervalDays: z.coerce.number().int().min(1).max(365),
  lastCompletedAt: z.string().datetime().optional(),
  nextReminderAt: z.string().datetime().optional(),
  notes: z.string().trim().max(1000).optional()
});

export const updateCleaningTaskSchema = cleaningTaskSchema.partial();

export type CleaningTaskInput = z.infer<typeof cleaningTaskSchema>;
export type UpdateCleaningTaskInput = z.infer<typeof updateCleaningTaskSchema>;

