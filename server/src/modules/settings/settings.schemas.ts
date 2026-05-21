import { z } from "zod";

export const notificationSettingsSchema = z.object({
  pushNotifications: z.boolean().optional(),
  emailUpdates: z.boolean().optional(),
  reminderCategories: z.object({
    classes: z.boolean().optional(),
    tasks: z.boolean().optional(),
    work: z.boolean().optional(),
    groceries: z.boolean().optional(),
    cleaning: z.boolean().optional(),
    splitSettlements: z.boolean().optional(),
  }).optional(),
});

export const preferenceSettingsSchema = z.object({
  theme: z.enum(["SYSTEM", "LIGHT", "DARK"]).optional(),
  language: z.string().trim().min(2).max(12).optional(),
  currency: z.string().trim().length(3).optional(),
  dateFormat: z.enum(["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
  timeFormat: z.enum(["24H", "12H"]).optional(),
});

export const aiSettingsSchema = z.object({
  aiSuggestionsEnabled: z.boolean().optional(),
  aiFormSuggestionsAllowed: z.boolean().optional(),
  clearCache: z.boolean().optional(),
});

export const workSettingsSchema = z.object({
  workCountry: z.string().trim().length(2).optional(),
  yearlyWorkLimitDays: z.coerce.number().int().min(1).max(366).optional(),
  defaultHourlyWage: z.coerce.number().positive().nullable().optional(),
});

export const moduleSettingsSchema = z.object({
  userEnabledModules: z.object({
    work: z.boolean().optional(),
    money: z.boolean().optional(),
    splits: z.boolean().optional(),
    tasks: z.boolean().optional(),
    groceries: z.boolean().optional(),
    cleaning: z.boolean().optional(),
    ai: z.boolean().optional(),
  }).optional(),
});

export const updateSettingsSchema = notificationSettingsSchema
  .merge(preferenceSettingsSchema)
  .merge(aiSettingsSchema)
  .merge(workSettingsSchema)
  .merge(moduleSettingsSchema);

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type PreferenceSettingsInput = z.infer<typeof preferenceSettingsSchema>;
export type AISettingsInput = z.infer<typeof aiSettingsSchema>;
export type WorkSettingsInput = z.infer<typeof workSettingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
