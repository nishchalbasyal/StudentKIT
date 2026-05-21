import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  country: z.string().trim().length(2).default("DE"),
  studentStatus: z
    .enum(["INTERNATIONAL", "EU_EEA_SWISS", "GERMAN", "OTHER"])
    .default("INTERNATIONAL"),
  hourlyWageDefault: z.coerce.number().positive().optional(),
  currency: z.string().trim().length(3).default("EUR")
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

