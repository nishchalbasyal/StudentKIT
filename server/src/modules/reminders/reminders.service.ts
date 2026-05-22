import type { LinkedEntityType, ReminderType } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type { ReminderInput, RemindersSyncInput } from "./reminders.schemas.js";

type ReminderRecord = {
  id: string;
  localId: string;
  userId: string;
  title: string;
  message: string | null;
  type: ReminderType;
  sourceType: LinkedEntityType | null;
  sourceId: string | null;
  scheduledAt: Date;
  repeatRule: string | null;
  isEnabled: boolean;
  isCompleted: boolean;
  completedAt: Date | null;
  deliveryType: string;
  linkedEntityType: LinkedEntityType | null;
  linkedEntityId: string | null;
  syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeType(input: ReminderInput): ReminderType {
  if (input.type) return input.type;
  if (input.sourceType === "SPLIT") return "CUSTOM";
  return input.sourceType === "GROCERY" ||
    input.sourceType === "CLEANING" ||
    input.sourceType === "WORK" ||
    input.sourceType === "CLASS" ||
    input.sourceType === "TASK"
    ? input.sourceType
    : "CUSTOM";
}

function normalizeSourceType(input: ReminderInput): LinkedEntityType | null {
  if (input.linkedEntityType) return input.linkedEntityType;
  if (input.sourceType === "GROCERY") return "GROCERY_ITEM";
  if (input.sourceType === "CLEANING") return "CLEANING_TASK";
  if (input.sourceType === "WORK") return "WORK_SHIFT";
  if (input.sourceType === "CLASS") return "CLASS";
  if (input.sourceType === "TASK") return "TASK";
  if (input.sourceType === "SPLIT") return "CUSTOM";
  return null;
}

function reminderData(input: ReminderInput, userId?: string) {
  const scheduledAt = new Date(input.scheduledAt ?? input.remindAt!);

  return {
    userId,
    localId: input.localId,
    title: input.title,
    message: input.message ?? null,
    type: normalizeType(input),
    sourceType: normalizeSourceType(input),
    sourceId: input.sourceId ?? input.linkedEntityId ?? null,
    scheduledAt,
    repeatRule: input.repeatRule ?? null,
    isEnabled: input.isEnabled ?? true,
    isCompleted: input.isCompleted ?? false,
    deliveryType: input.deliveryType ?? "IN_APP",
    linkedEntityType: input.linkedEntityType ?? normalizeSourceType(input),
    linkedEntityId: input.linkedEntityId ?? input.sourceId ?? null,
    syncedAt: input.syncedAt ? new Date(input.syncedAt) : null,
  } as Record<string, unknown>;
}

function serializeReminder(record: ReminderRecord) {
  return {
    id: record.id,
    localId: record.localId,
    userId: record.userId,
    sourceType: record.sourceType ?? undefined,
    sourceId: record.sourceId ?? undefined,
    title: record.title,
    message: record.message,
    type: record.type,
    scheduledAt: record.scheduledAt,
    remindAt: record.scheduledAt,
    repeatRule: record.repeatRule,
    isEnabled: record.isEnabled,
    isCompleted: record.isCompleted,
    completedAt: record.completedAt,
    deliveryType: record.deliveryType,
    linkedEntityType: record.linkedEntityType,
    linkedEntityId: record.linkedEntityId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    syncedAt: record.syncedAt,
  };
}

async function assertReminderOwner(userId: string, id: string) {
  const reminder = await (prisma.reminder as any).findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!reminder) {
    throw new HttpError(404, "NOT_FOUND", "Reminder not found");
  }
}

async function upsertReminder(
  userId: string,
  input: ReminderInput,
  existingId?: string,
) {
  const data = reminderData(input, userId);
  if (existingId) {
    return prisma.reminder.update({ where: { id: existingId }, data } as any);
  }

  return prisma.reminder.create({
    data,
  } as any);
}

export async function listReminders(userId: string) {
  const reminders = await (prisma.reminder as any).findMany({
    where: { userId },
    orderBy: [{ isCompleted: "asc" }, { scheduledAt: "asc" }],
  });

  return reminders.map((reminder: ReminderRecord) =>
    serializeReminder(reminder),
  );
}

export async function createReminder(userId: string, input: ReminderInput) {
  const created = await upsertReminder(userId, input);
  return serializeReminder(created as ReminderRecord);
}

export async function updateReminder(
  userId: string,
  id: string,
  input: ReminderInput,
) {
  await assertReminderOwner(userId, id);
  const saved = await upsertReminder(userId, input, id);
  return serializeReminder(saved as ReminderRecord);
}

export async function completeReminder(userId: string, id: string) {
  await assertReminderOwner(userId, id);

  const updated = await prisma.reminder.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
  } as any);

  return serializeReminder(updated as ReminderRecord);
}

export async function deleteReminder(userId: string, id: string) {
  await assertReminderOwner(userId, id);
  await prisma.reminder.delete({ where: { id } } as any);

  return { id };
}

export async function syncReminders(userId: string, input: RemindersSyncInput) {
  const results: Array<{
    localId?: string | null;
    id: string;
    status: string;
  }> = [];

  for (const reminder of input.reminders) {
    if (reminder.deleted && reminder.id) {
      const existing = await (prisma.reminder as any).findFirst({
        where: { id: reminder.id, userId },
        select: { id: true },
      });
      if (existing) {
        await prisma.reminder.delete({ where: { id: existing.id } } as any);
      }
      results.push({
        localId: reminder.localId ?? null,
        id: reminder.id,
        status: "deleted",
      });
      continue;
    }

    const linkedEntityId =
      reminder.linkedEntityId ?? reminder.sourceId ?? reminder.localId;
    const type = normalizeType(reminder as ReminderInput);
    const existing = linkedEntityId
      ? await (prisma.reminder as any).findFirst({
          where: {
            userId,
            linkedEntityId,
            type,
          },
        })
      : null;

    const saved = existing
      ? await prisma.reminder.update({
          where: { id: existing.id },
          data: reminderData(reminder as ReminderInput, userId),
        } as any)
      : await prisma.reminder.create({
          data: reminderData(reminder as ReminderInput, userId),
        } as any);

    results.push({
      localId: reminder.localId ?? (saved as ReminderRecord).localId,
      id: (saved as ReminderRecord).id,
      status: existing ? "updated" : "created",
    });
  }

  return { results };
}
