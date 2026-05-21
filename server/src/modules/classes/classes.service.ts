import type { ClassSchedule, DayOfWeek, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { parseTimeOnly, toTimeOnlyString } from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import type { ClassScheduleInput, UpdateClassScheduleInput } from "./classes.schemas.js";

const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function mapClassSchedule(classSchedule: ClassSchedule) {
  return {
    ...classSchedule,
    startTime: toTimeOnlyString(classSchedule.startTime),
    endTime: toTimeOnlyString(classSchedule.endTime)
  };
}

function inputToData(input: ClassScheduleInput | UpdateClassScheduleInput) {
  const data: Prisma.ClassScheduleUncheckedCreateInput | Prisma.ClassScheduleUncheckedUpdateInput = {};

  if (input.courseName !== undefined) data.courseName = input.courseName;
  if (input.professorName !== undefined) data.professorName = input.professorName;
  if (input.dayOfWeek !== undefined) data.dayOfWeek = input.dayOfWeek;
  if (input.startTime !== undefined) data.startTime = parseTimeOnly(input.startTime);
  if (input.endTime !== undefined) data.endTime = parseTimeOnly(input.endTime);
  if (input.location !== undefined) data.location = input.location;
  if (input.attendanceType !== undefined) data.attendanceType = input.attendanceType;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.reminderMinutesBefore !== undefined) data.reminderMinutesBefore = input.reminderMinutesBefore;
  if (input.notes !== undefined) data.notes = input.notes;

  return data;
}

export async function listClasses(userId: string) {
  const classes = await prisma.classSchedule.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  return classes.map(mapClassSchedule).sort((left, right) => {
    const dayDiff = dayOrder.indexOf(left.dayOfWeek) - dayOrder.indexOf(right.dayOfWeek);
    return dayDiff || left.startTime.localeCompare(right.startTime);
  });
}

export async function createClass(userId: string, input: ClassScheduleInput) {
  const classSchedule = await prisma.classSchedule.create({
    data: {
      ...inputToData(input),
      userId
    } as Prisma.ClassScheduleUncheckedCreateInput
  });

  return mapClassSchedule(classSchedule);
}

export async function updateClass(userId: string, id: string, input: UpdateClassScheduleInput) {
  await assertClassOwner(userId, id);
  const classSchedule = await prisma.classSchedule.update({
    where: { id },
    data: inputToData(input)
  });

  return mapClassSchedule(classSchedule);
}

export async function deleteClass(userId: string, id: string) {
  await assertClassOwner(userId, id);
  await prisma.classSchedule.delete({ where: { id } });

  return { id };
}

export async function getWeeklyClasses(userId: string) {
  const classes = await listClasses(userId);

  return dayOrder.map((dayOfWeek) => ({
    dayOfWeek,
    classes: classes.filter((classSchedule) => classSchedule.dayOfWeek === dayOfWeek)
  }));
}

export async function getTodayClasses(userId: string, today = new Date()) {
  const dayOfWeek = dayOrder[(today.getUTCDay() + 6) % 7]! as DayOfWeek;
  const classes = await prisma.classSchedule.findMany({
    where: { userId, dayOfWeek },
    orderBy: { startTime: "asc" }
  });

  return classes.map(mapClassSchedule);
}

async function assertClassOwner(userId: string, id: string) {
  const classSchedule = await prisma.classSchedule.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!classSchedule) {
    throw new HttpError(404, "NOT_FOUND", "Class not found");
  }
}
