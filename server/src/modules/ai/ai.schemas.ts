import { z } from "zod";

export const studyPlanSchema = z.object({
  availableHoursThisWeek: z.coerce.number().positive().max(100).optional()
});

export type StudyPlanInput = z.infer<typeof studyPlanSchema>;

