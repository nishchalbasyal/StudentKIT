import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type { ReminderInput, RemindersSyncInput } from "./reminders.schemas.js";

function normalizeType(input: ReminderInput) {
  if (input.type) return input.type;
  if (input.sourceType === "SPLIT") return "CUSTOM";
  return input.sourceType ?? "CUSTOM";
}

function normalizeLinkedEntityType(input: ReminderInput) {
  if (input.linkedEntityType) return input.linkedEntityType;
  if (input.sourceType === "GROCERY") return "GROCERY_ITEM";
  if (input.sourceType === "CLEANING") return "CLEANING_TASK";
  if (input.sourceType === "WORK") return "WORK_SHIFT";
  if (input.sourceType === "SPLIT") return "CUSTOM";
  return input.sourceType;
}

function reminderData(input: ReminderInput) {
  return {
    title: input.title,
    message: input.message,
    type: normalizeType(input),
    scheduledAt: new Date(input.scheduledAt ?? input.remindAt!),
    linkedEntityType: normalizeLinkedEntityType(input),
    linkedEntityId: input.linkedEntityId ?? input.sourceId,
    isCompleted: input.isCompleted,
  } as Prisma.ReminderUncheckedCreateInput & Prisma.ReminderUncheckedUpdateInput;
}

export async function listReminders(userId: string) {
  return prisma.reminder.findMany({
    where: { userId },
    orderBy: [{ isCompleted: "asc" }, { scheduledAt: "asc" }]
  });
}

export async function createReminder(userId: string, input: ReminderInput) {
  return prisma.reminder.create({
    data: {
      ...reminderData(input),
      userId
    } as Prisma.ReminderUncheckedCreateInput
  });
}

export async function updateReminder(userId: string, id: string, input: ReminderInput) {
  await assertReminderOwner(userId, id);

  return prisma.reminder.update({
    where: { id },
    data: reminderData(input) as Prisma.ReminderUncheckedUpdateInput
  });
}

export async function completeReminder(userId: string, id: string) {
  await assertReminderOwner(userId, id);

  return prisma.reminder.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date()
    }
  });
}

export async function deleteReminder(userId: string, id: string) {
  await assertReminderOwner(userId, id);
  await prisma.reminder.delete({ where: { id } });

  return { id };
}

export async function syncReminders(userId: string, input: RemindersSyncInput) {
  const results = [];

  for (const reminder of input.reminders) {
    if (reminder.deleted && reminder.id) {
      const existing = await prisma.reminder.findFirst({ where: { id: reminder.id, userId }, select: { id: true } });
      if (existing) await prisma.reminder.delete({ where: { id: reminder.id } });
      results.push({ localId: reminder.localId, id: reminder.id, status: "deleted" });
      continue;
    }

    const linkedEntityId = reminder.linkedEntityId ?? reminder.sourceId ?? reminder.localId;
    const existing = linkedEntityId
      ? await prisma.reminder.findFirst({
          where: {
            userId,
            linkedEntityId,
            type: normalizeType(reminder),
          },
        })
      : null;

    const saved = existing
      ? await prisma.reminder.update({
          where: { id: existing.id },
          data: reminderData(reminder) as Prisma.ReminderUncheckedUpdateInput,
        })
      : await createReminder(userId, reminder);

    results.push({ localId: reminder.localId, id: saved.id, status: existing ? "updated" : "created" });
  }

  return { results };
}

async function assertReminderOwner(userId: string, id: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId }, select: { id: true } });

  if (!reminder) {
    throw new HttpError(404, "NOT_FOUND", "Reminder not found");
  }
}
