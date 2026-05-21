import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workShiftSchema = z
  .object({
    companyId: z.string().optional().nullable(),
    jobName: z.string().trim().min(1, "Job name is required"),
    date: z.string().date("Use YYYY-MM-DD"),
    startTime: z.string().regex(timeRegex, "Use HH:mm"),
    endTime: z.string().regex(timeRegex, "Use HH:mm"),
    breakMinutes: z.coerce
      .number()
      .int()
      .min(0, "Break cannot be negative")
      .default(0),
    hourlyWage: z.coerce.number().positive("Hourly wage must be positive"),
    bonusType: z
      .enum(["NONE", "DOUBLE", "PERCENTAGE", "FIXED", "NIGHT_SHIFT", "CUSTOM"])
      .default("NONE"),
    bonusValue: z.coerce.number().min(0).optional(),
    isPublicHoliday: z.coerce.boolean().default(false),
    notes: z.string().trim().max(1000).optional(),
  });

export type WorkShiftFormValues = z.infer<typeof workShiftSchema>;
