import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workShiftSchema = z
  .object({
    workplace: z.string().trim().max(120).optional(),
    date: z.string().date("Use YYYY-MM-DD"),
    startTime: z.string().regex(timeRegex, "Use HH:mm"),
    endTime: z.string().regex(timeRegex, "Use HH:mm"),
    breakMinutes: z.coerce
      .number()
      .int()
      .min(0, "Break cannot be negative")
      .default(0),
    hourlyWage: z.coerce.number().positive("Hourly wage must be positive"),
    note: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, context) => {
    const [startHours = 0, startMinutes = 0] = value.startTime.split(":").map(Number);
    const [endHours = 0, endMinutes = 0] = value.endTime.split(":").map(Number);
    let durationMinutes = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

    if (durationMinutes <= 0) {
      durationMinutes += 24 * 60;
    }

    if (value.breakMinutes > durationMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["breakMinutes"],
        message: "Break cannot be longer than shift duration",
      });
    }
  });

export type WorkShiftFormValues = z.infer<typeof workShiftSchema>;
