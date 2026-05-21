import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const classScheduleSchema = z.object({
  courseName: z.string().trim().min(1).max(160),
  professorName: z.string().trim().max(120).optional(),
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
  ]),
  startTime: timeSchema,
  endTime: timeSchema,
  location: z.string().trim().max(160).optional(),
  attendanceType: z.enum(["MANDATORY", "OPTIONAL", "FLEXIBLE"]).default("FLEXIBLE"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  reminderMinutesBefore: z.coerce.number().int().min(0).max(1440).optional(),
  notes: z.string().trim().max(1000).optional()
});

export const updateClassScheduleSchema = classScheduleSchema.partial();

export type ClassScheduleInput = z.infer<typeof classScheduleSchema>;
export type UpdateClassScheduleInput = z.infer<typeof updateClassScheduleSchema>;

