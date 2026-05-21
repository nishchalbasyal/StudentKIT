import { z } from "zod";

export const workShiftSchema = z.object({
  jobName: z.string().trim().min(1).max(120),
  date: z.string().date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
  hourlyWage: z.coerce.number().positive().max(1000),
  bonusType: z
    .enum(["NONE", "DOUBLE", "PERCENTAGE", "FIXED", "NIGHT_SHIFT", "CUSTOM"])
    .default("NONE"),
  bonusValue: z.coerce.number().min(0).optional(),
  isPublicHoliday: z.coerce.boolean().default(false),
  notes: z.string().trim().max(1000).optional()
});

export type WorkShiftInput = z.infer<typeof workShiftSchema>;

