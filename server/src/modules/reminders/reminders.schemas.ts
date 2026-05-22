import { z } from "zod";

const reminderBaseSchema = z.object({
  localId: z.string().trim().min(1).max(160).optional(),
  title: z.string().trim().min(1).max(180),
  message: z.string().trim().max(1000).optional(),
  type: z
    .enum([
      "CLASS",
      "TASK",
      "GROCERY",
      "CLEANING",
      "WORK",
      "EXPENSE",
      "AI",
      "CUSTOM",
    ])
    .optional(),
  sourceType: z
    .enum(["CLASS", "TASK", "GROCERY", "CLEANING", "WORK", "SPLIT", "CUSTOM"])
    .optional(),
  sourceId: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  remindAt: z.string().datetime().optional(),
  repeatRule: z.string().trim().max(120).nullable().optional(),
  isEnabled: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  deliveryType: z.enum(["PUSH", "IN_APP", "CALENDAR"]).optional(),
  linkedEntityType: z
    .enum([
      "CLASS",
      "TASK",
      "GROCERY_ITEM",
      "GROCERY_PURCHASE",
      "SHOPPING_LIST_ITEM",
      "CLEANING_TASK",
      "WORK_SHIFT",
      "EXPENSE",
      "BUDGET",
      "AI_INSIGHT",
      "CUSTOM",
    ])
    .optional(),
  linkedEntityId: z.string().min(1).optional(),
  syncedAt: z.string().datetime().nullable().optional(),
});

export const reminderSchema = reminderBaseSchema.refine(
  (input) => input.scheduledAt || input.remindAt,
  {
    message: "scheduledAt or remindAt is required",
  },
);

export const remindersSyncSchema = z.object({
  reminders: z
    .array(
      reminderBaseSchema
        .extend({
          id: z.string().optional(),
          localId: z.string().optional(),
          updatedAt: z.string().datetime().optional(),
          deleted: z.boolean().optional(),
        })
        .refine(
          (input) => input.deleted || input.scheduledAt || input.remindAt,
          {
            message: "scheduledAt or remindAt is required",
          },
        ),
    )
    .default([]),
});

export type ReminderInput = z.infer<typeof reminderSchema>;
export type RemindersSyncInput = z.infer<typeof remindersSyncSchema>;
