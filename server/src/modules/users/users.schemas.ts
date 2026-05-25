import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
  country: z.string().trim().length(2).default("DE"),
  studentStatus: z
    .enum(["INTERNATIONAL", "EU_EEA_SWISS", "GERMAN", "OTHER"])
    .default("INTERNATIONAL"),
  hourlyWageDefault: z.coerce.number().positive().optional(),
  currency: z.string().trim().length(3).default("EUR"),
});

export const userSearchQuerySchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters").max(100),
});

export const updateUserMeSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().optional(),
  country: z.string().trim().length(2).optional(),
  studentStatus: z.enum(["INTERNATIONAL", "EU_EEA_SWISS", "GERMAN", "OTHER"]).optional(),
  hourlyWageDefault: z.coerce.number().positive().nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
  university: z.string().trim().max(120).nullable().optional(),
  course: z.string().trim().max(120).nullable().optional(),
  yearlyWorkLimitDays: z.coerce.number().int().min(1).max(366).optional()
});

export const avatarSchema = z.object({
  avatarUrl: z.string().trim().url().nullable()
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
export type UpdateUserMeInput = z.infer<typeof updateUserMeSchema>;
export type AvatarInput = z.infer<typeof avatarSchema>;
