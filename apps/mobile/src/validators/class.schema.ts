import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const classSchema = z.object({
  courseName: z.string().trim().min(1, "Course name is required"),
  professorName: z.string().trim().max(120).optional(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(timeRegex, "Use HH:mm"),
  endTime: z.string().regex(timeRegex, "Use HH:mm"),
  location: z.string().trim().max(160).optional(),
  attendanceType: z.enum(["MANDATORY", "OPTIONAL", "FLEXIBLE"]).default("FLEXIBLE"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  reminderMinutesBefore: z.coerce.number().int().min(0).max(1440).optional(),
  notes: z.string().trim().max(1000).optional()
});

export type ClassFormValues = z.infer<typeof classSchema>;

