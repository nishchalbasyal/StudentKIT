import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const workShiftSchema = z.object({
  companyId: z.string().optional().nullable(),
  jobName: z.string().trim().min(1).max(120),
  date: z.string().date(),
  startTime: timeSchema,
  endTime: timeSchema,
  breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
  hourlyWage: z.coerce.number().positive().max(1000),
  bonusType: z
    .enum(["NONE", "DOUBLE", "PERCENTAGE", "FIXED", "NIGHT_SHIFT", "CUSTOM"])
    .default("NONE"),
  bonusValue: z.coerce.number().min(0).optional(),
  isPublicHoliday: z.coerce.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
});

export const updateWorkShiftSchema = workShiftSchema.partial();

const numericMonthlySummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const monthKeyMonthlySummaryQuerySchema = z
  .object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  })
  .transform(({ month }) => {
    const [yearPart, monthPart] = month.split("-");

    return {
      year: Number(yearPart),
      month: Number(monthPart),
    };
  });

export const monthlySummaryQuerySchema = z.union([
  numericMonthlySummaryQuerySchema,
  monthKeyMonthlySummaryQuerySchema,
]);

export const weeklySummaryQuerySchema = z.object({
  date: z.string().date().optional(),
});

export type WorkShiftInput = z.infer<typeof workShiftSchema>;
export type UpdateWorkShiftInput = z.infer<typeof updateWorkShiftSchema>;
export type MonthlySummaryQuery = z.infer<typeof monthlySummaryQuerySchema>;
export type WeeklySummaryQuery = z.infer<typeof weeklySummaryQuerySchema>;
