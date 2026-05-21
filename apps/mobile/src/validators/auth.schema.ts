import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  country: z.string().trim().length(2, "Use a 2-letter country code").default("DE"),
  studentStatus: z.enum(["INTERNATIONAL", "EU_EEA_SWISS", "GERMAN", "OTHER"]).default("INTERNATIONAL"),
  currency: z.string().trim().length(3, "Use a 3-letter currency").default("EUR"),
  hourlyWageDefault: z.coerce.number().positive().optional()
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

