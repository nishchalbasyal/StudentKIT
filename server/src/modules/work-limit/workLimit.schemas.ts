import { z } from "zod";

export const workLimitSettingsSchema = z.object({
  isLimitEnabled: z.boolean().optional(),
  limitType: z.enum(["UNLIMITED", "CUSTOM"]).optional(),
  limitValue: z.coerce.number().positive().nullable().optional(),
  limitUnit: z.enum(["HOURS", "DAYS"]).nullable().optional(),
  periodValue: z.coerce.number().int().positive().nullable().optional(),
  periodUnit: z
    .enum(["WEEK", "MONTH", "YEAR", "CUSTOM_DAYS"])
    .nullable()
    .optional(),
  warningPercentage: z.coerce.number().int().min(1).max(99).optional(),
  dangerPercentage: z.coerce.number().int().min(1).max(100).optional(),
  hasDismissedUnlimitedLimitBanner: z.boolean().optional(),
});

export type WorkLimitSettingsInput = z.infer<typeof workLimitSettingsSchema>;
