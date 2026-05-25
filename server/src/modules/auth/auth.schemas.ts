import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1).max(128)
});

export const googleSignInSchema = z.object({
  idToken: z.string().min(1)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32)
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  country: z.string().trim().length(2).optional(),
  studentStatus: z.enum(["INTERNATIONAL", "EU_EEA_SWISS", "GERMAN", "OTHER"]).optional(),
  hourlyWageDefault: z.coerce.number().positive().nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
  university: z.string().trim().max(120).nullable().optional(),
  course: z.string().trim().max(120).nullable().optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
