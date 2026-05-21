import type { Prisma, Task } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import type { TaskInput, UpdateTaskInput } from "./tasks.schemas.js";

function mapTask(task: Task) {
  return task;
}

function inputToData(input: TaskInput | UpdateTaskInput) {
  const data: Prisma.TaskUncheckedCreateInput | Prisma.TaskUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.type !== undefined) data.type = input.type;
  if (input.dueDate !== undefined) data.dueDate = new Date(input.dueDate);
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.status !== undefined) data.status = input.status;
  if (input.reminderAt !== undefined) data.reminderAt = new Date(input.reminderAt);
  if (input.calendarSyncEnabled !== undefined) data.calendarSyncEnabled = input.calendarSyncEnabled;
  if (input.calendarEventId !== undefined) data.calendarEventId = input.calendarEventId;
  if (input.linkedClassId !== undefined) data.linkedClassId = input.linkedClassId;

  return data;
}

export async function listTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
  });

  return tasks.map(mapTask);
}

export async function createTask(userId: string, input: TaskInput) {
  if (input.linkedClassId) {
    await assertLinkedClassOwner(userId, input.linkedClassId);
  }

  const task = await prisma.task.create({
    data: {
      ...inputToData(input),
      userId
    } as Prisma.TaskUncheckedCreateInput
  });

  await syncTaskReminder(userId, task);

  return mapTask(task);
}

export async function getUpcomingTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      OR: [{ dueDate: { gte: new Date() } }, { dueDate: null }]
    },
    orderBy: [{ dueDate: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
    take: 50
  });

  return tasks.map(mapTask);
}

export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  await assertTaskOwner(userId, id);

  if (input.linkedClassId) {
    await assertLinkedClassOwner(userId, input.linkedClassId);
  }

  const task = await prisma.task.update({
    where: { id },
    data: inputToData(input)
  });

  await syncTaskReminder(userId, task);

  return mapTask(task);
}

export async function completeTask(userId: string, id: string) {
  await assertTaskOwner(userId, id);
  const task = await prisma.task.update({
    where: { id },
    data: { status: "COMPLETED" }
  });

  await prisma.reminder.updateMany({
    where: {
      userId,
      linkedEntityType: "TASK",
      linkedEntityId: id,
      isCompleted: false
    },
    data: {
      isCompleted: true,
      completedAt: new Date()
    }
  });

  return mapTask(task);
}

export async function deleteTask(userId: string, id: string) {
  await assertTaskOwner(userId, id);
  await prisma.task.delete({ where: { id } });

  return { id };
}

async function syncTaskReminder(userId: string, task: Task) {
  if (!task.reminderAt || task.status === "COMPLETED" || task.status === "CANCELLED") {
    await prisma.reminder.deleteMany({
      where: {
        userId,
        linkedEntityType: "TASK",
        linkedEntityId: task.id,
        isCompleted: false
      }
    });
    return;
  }

  const existingReminder = await prisma.reminder.findFirst({
    where: {
      userId,
      linkedEntityType: "TASK",
      linkedEntityId: task.id,
      isCompleted: false
    }
  });

  const data = {
    userId,
    title: `Task reminder: ${task.title}`,
    message: task.dueDate ? `Due ${task.dueDate.toISOString()}` : "Task reminder",
    type: "TASK" as const,
    scheduledAt: task.reminderAt,
    linkedEntityType: "TASK" as const,
    linkedEntityId: task.id
  };

  if (existingReminder) {
    await prisma.reminder.update({
      where: { id: existingReminder.id },
      data
    });
  } else {
    await prisma.reminder.create({ data });
  }
}

async function assertTaskOwner(userId: string, id: string) {
  const task = await prisma.task.findFirst({ where: { id, userId }, select: { id: true } });

  if (!task) {
    throw new HttpError(404, "NOT_FOUND", "Task not found");
  }
}

async function assertLinkedClassOwner(userId: string, id: string) {
  const classSchedule = await prisma.classSchedule.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!classSchedule) {
    throw new HttpError(404, "NOT_FOUND", "Linked class not found");
  }
}
