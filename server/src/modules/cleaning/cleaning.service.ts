import type { CleaningTask, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { addDays, differenceInDays } from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import type { CleaningTaskInput, UpdateCleaningTaskInput } from "./cleaning.schemas.js";

function mapCleaningTask(task: CleaningTask) {
  return {
    ...task,
    daysSinceLastDone: task.lastCompletedAt
      ? differenceInDays(new Date(), task.lastCompletedAt)
      : null
  };
}

function inputToData(input: CleaningTaskInput | UpdateCleaningTaskInput) {
  const data: Prisma.CleaningTaskUncheckedCreateInput | Prisma.CleaningTaskUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.intervalDays !== undefined) data.intervalDays = input.intervalDays;
  if (input.lastCompletedAt !== undefined) data.lastCompletedAt = new Date(input.lastCompletedAt);
  if (input.nextReminderAt !== undefined) data.nextReminderAt = new Date(input.nextReminderAt);
  if (input.notes !== undefined) data.notes = input.notes;

  return data;
}

export async function listCleaningTasks(userId: string) {
  const tasks = await prisma.cleaningTask.findMany({
    where: { userId },
    orderBy: [{ nextReminderAt: "asc" }, { title: "asc" }]
  });

  return tasks.map(mapCleaningTask);
}

export async function createCleaningTask(userId: string, input: CleaningTaskInput) {
  const task = await prisma.cleaningTask.create({
    data: {
      ...inputToData(input),
      userId
    } as Prisma.CleaningTaskUncheckedCreateInput
  });

  await syncCleaningReminder(userId, task);

  return mapCleaningTask(task);
}

export async function updateCleaningTask(userId: string, id: string, input: UpdateCleaningTaskInput) {
  await assertCleaningTaskOwner(userId, id);
  const task = await prisma.cleaningTask.update({
    where: { id },
    data: inputToData(input)
  });

  await syncCleaningReminder(userId, task);

  return mapCleaningTask(task);
}

export async function completeCleaningTask(userId: string, id: string) {
  await assertCleaningTaskOwner(userId, id);
  const existing = await prisma.cleaningTask.findUniqueOrThrow({ where: { id } });
  const completedAt = new Date();
  const nextReminderAt = addDays(completedAt, existing.intervalDays);
  const task = await prisma.cleaningTask.update({
    where: { id },
    data: {
      lastCompletedAt: completedAt,
      nextReminderAt
    }
  });

  await syncCleaningReminder(userId, task);

  return mapCleaningTask(task);
}

export async function deleteCleaningTask(userId: string, id: string) {
  await assertCleaningTaskOwner(userId, id);
  await prisma.cleaningTask.delete({ where: { id } });
  await prisma.reminder.deleteMany({
    where: {
      userId,
      linkedEntityType: "CLEANING_TASK",
      linkedEntityId: id,
      isCompleted: false
    }
  });

  return { id };
}

async function syncCleaningReminder(userId: string, task: CleaningTask) {
  if (!task.nextReminderAt) {
    return;
  }

  const existingReminder = await prisma.reminder.findFirst({
    where: {
      userId,
      linkedEntityType: "CLEANING_TASK",
      linkedEntityId: task.id,
      isCompleted: false
    }
  });

  const data = {
    userId,
    title: `Cleaning reminder: ${task.title}`,
    message: `Time to do: ${task.title}`,
    type: "CLEANING" as const,
    scheduledAt: task.nextReminderAt,
    linkedEntityType: "CLEANING_TASK" as const,
    linkedEntityId: task.id
  };

  if (existingReminder) {
    await prisma.reminder.update({ where: { id: existingReminder.id }, data });
  } else {
    await prisma.reminder.create({ data });
  }
}

async function assertCleaningTaskOwner(userId: string, id: string) {
  const task = await prisma.cleaningTask.findFirst({ where: { id, userId }, select: { id: true } });

  if (!task) {
    throw new HttpError(404, "NOT_FOUND", "Cleaning task not found");
  }
}

