import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  industry: z.string().max(255).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  contact: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  defaultHourlyWage: z.coerce.number().positive().max(1000).optional().nullable(),
  defaultBreakMinutes: z.coerce.number().int().min(0).max(600).default(0),
  defaultBonusType: z.enum(["NONE", "DOUBLE", "PERCENTAGE", "FIXED", "NIGHT_SHIFT", "CUSTOM"]).default("NONE"),
  defaultBonusValue: z.coerce.number().min(0).max(100000).optional().nullable(),
  color: z.string().max(32).optional().nullable(),
  commonStartTime: timeSchema.optional().nullable(),
  commonEndTime: timeSchema.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
