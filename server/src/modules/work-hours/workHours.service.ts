import type { Prisma, WorkShift } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import {
  getMonthRange,
  getWeekRange,
  getYearRange,
  parseDateOnly,
  parseTimeOnly,
  toDateOnlyString,
  toTimeOnlyString,
  timeToMinutes,
} from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import {
  calculateIncome,
  calculateWorkedHours,
  calculateWorkLimitUsage,
  roundHours,
  roundMoney,
} from "./workHours.calculations.js";
import type {
  MonthlySummaryQuery,
  UpdateWorkShiftInput,
  WeeklySummaryQuery,
  WorkShiftInput,
} from "./workHours.schemas.js";

const defaultGermanyPolicy = {
  yearlyFullDayLimit: 140,
  yearlyHalfDayLimit: 280,
  halfDayMaxHours: 4,
};

function mapShift(shift: WorkShift) {
  const hours = calculateWorkedHours(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
  );
  const income = calculateIncome(
    hours,
    Number(shift.hourlyWage),
    shift.bonusType,
    shift.bonusValue ? Number(shift.bonusValue) : null,
  );

  return {
    ...shift,
    date: toDateOnlyString(shift.date),
    startTime: toTimeOnlyString(shift.startTime),
    endTime: toTimeOnlyString(shift.endTime),
    hourlyWage: Number(shift.hourlyWage),
    bonusValue: shift.bonusValue ? Number(shift.bonusValue) : null,
    calculatedHours: hours,
    calculatedIncome: income,
  };
}

function inputToData(input: WorkShiftInput | UpdateWorkShiftInput) {
  const data:
    | Prisma.WorkShiftUncheckedCreateInput
    | Prisma.WorkShiftUncheckedUpdateInput = {};

  if (input.companyId !== undefined) data.companyId = input.companyId;
  if (input.jobName !== undefined) data.jobName = input.jobName;
  if (input.date !== undefined) data.date = parseDateOnly(input.date);
  if (input.startTime !== undefined)
    data.startTime = parseTimeOnly(input.startTime);
  if (input.endTime !== undefined) data.endTime = parseTimeOnly(input.endTime);
  if (input.breakMinutes !== undefined) data.breakMinutes = input.breakMinutes;
  if (input.hourlyWage !== undefined) data.hourlyWage = input.hourlyWage;
  if (input.bonusType !== undefined) data.bonusType = input.bonusType;
  if (input.bonusValue !== undefined) data.bonusValue = input.bonusValue;
  if (input.isPublicHoliday !== undefined)
    data.isPublicHoliday = input.isPublicHoliday;
  if (input.notes !== undefined) data.notes = input.notes;

  return data;
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildCompanySummaries(shifts: Array<ReturnType<typeof mapShift>>) {
  const companies = new Map<
    string,
    {
      companyId: string | null;
      companyName: string;
      totalHours: number;
      totalIncome: number;
      averageHourlyIncome: number;
      shiftCount: number;
    }
  >();

  for (const shift of shifts) {
    const companyName = shift.jobName.trim() || "Unknown job";
    const existing = companies.get(companyName) ?? {
      companyId: shift.companyId,
      companyName,
      totalHours: 0,
      totalIncome: 0,
      averageHourlyIncome: 0,
      shiftCount: 0,
    };

    existing.totalHours += shift.calculatedHours;
    existing.totalIncome += shift.calculatedIncome;
    existing.shiftCount += 1;
    companies.set(companyName, existing);
  }

  return Array.from(companies.values())
    .map((company) => ({
      ...company,
      totalHours: roundHours(company.totalHours),
      totalIncome: roundMoney(company.totalIncome),
      averageHourlyIncome:
        company.totalHours > 0
          ? roundMoney(company.totalIncome / company.totalHours)
          : 0,
    }))
    .sort((a, b) => b.totalIncome - a.totalIncome);
}

export async function listWorkShifts(userId: string) {
  const shifts = await prisma.workShift.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return shifts.map(mapShift);
}

export async function getWorkShiftById(userId: string, id: string) {
  const shift = await prisma.workShift.findFirst({
    where: { id, userId },
    include: { company: true },
  });

  if (!shift) {
    throw new HttpError(404, "NOT_FOUND", "Work shift not found");
  }

  return mapShift(shift);
}

export async function createWorkShift(userId: string, input: WorkShiftInput) {
  validateWorkedMinutes(parseTimeOnly(input.startTime), parseTimeOnly(input.endTime), input.breakMinutes);
  const shift = await prisma.workShift.create({
    data: {
      ...inputToData(input),
      userId,
    } as Prisma.WorkShiftUncheckedCreateInput,
  });

  return mapShift(shift);
}

export async function updateWorkShift(
  userId: string,
  id: string,
  input: UpdateWorkShiftInput,
) {
  await assertWorkShiftOwner(userId, id);
  const existing = await prisma.workShift.findUniqueOrThrow({ where: { id } });
  validateWorkedMinutes(
    input.startTime ? parseTimeOnly(input.startTime) : existing.startTime,
    input.endTime ? parseTimeOnly(input.endTime) : existing.endTime,
    input.breakMinutes ?? existing.breakMinutes,
  );
  const shift = await prisma.workShift.update({
    where: { id },
    data: inputToData(input),
  });

  return mapShift(shift);
}

function validateWorkedMinutes(startTime: Date, endTime: Date, breakMinutes: number) {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const workedMinutes = endMinutes - startMinutes - breakMinutes;

  if (workedMinutes < 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Break time cannot be longer than the shift.");
  }
}

export async function deleteWorkShift(userId: string, id: string) {
  await assertWorkShiftOwner(userId, id);
  await prisma.workShift.delete({ where: { id } });

  return { id };
}

export async function getMonthlyWorkSummary(
  userId: string,
  query: MonthlySummaryQuery,
) {
  const { start, end } = getMonthRange(query.year, query.month);
  const shifts = await prisma.workShift.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const mapped = shifts.map(mapShift);
  const totalHours = roundHours(
    mapped.reduce((sum, shift) => sum + shift.calculatedHours, 0),
  );
  const totalIncome = roundMoney(
    mapped.reduce((sum, shift) => sum + shift.calculatedIncome, 0),
  );
  const workLimit = await getWorkLimitForYear(userId, query.year);

  return {
    year: query.year,
    month: query.month,
    monthKey: getMonthKey(query.year, query.month),
    totalHours,
    totalIncome,
    shiftCount: mapped.length,
    remainingLimitDays: workLimit.usage.remainingFullDayUnits,
    remainingLimitHours: null,
    companies: buildCompanySummaries(mapped),
    workLimit,
    shifts: mapped,
  };
}

export async function getWeeklyWorkSummary(
  userId: string,
  query: WeeklySummaryQuery,
) {
  const anchorDate = query.date ? parseDateOnly(query.date) : new Date();
  const { start, end } = getWeekRange(anchorDate);
  const shifts = await prisma.workShift.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const mapped = shifts.map(mapShift);

  return {
    weekStart: toDateOnlyString(start),
    weekEnd: toDateOnlyString(new Date(end.getTime() - 1)),
    totalHours: roundHours(
      mapped.reduce((sum, shift) => sum + shift.calculatedHours, 0),
    ),
    totalIncome: roundMoney(
      mapped.reduce((sum, shift) => sum + shift.calculatedIncome, 0),
    ),
    shiftCount: mapped.length,
    shifts: mapped,
  };
}

export async function getMonthlyIncome(
  userId: string,
  year: number,
  month: number,
) {
  const summary = await getMonthlyWorkSummary(userId, { year, month });
  return summary.totalIncome;
}

export async function getWorkLimitForYear(userId: string, year: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true, studentStatus: true },
  });

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "User not found");
  }

  const { start, end } = getYearRange(year);
  const [policy, shifts] = await Promise.all([
    prisma.workLimitPolicy.findFirst({
      where: {
        countryCode: user.country,
        studentStatus: user.studentStatus,
        effectiveFrom: { lte: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
      },
      orderBy: { effectiveFrom: "desc" },
    }),
    prisma.workShift.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
    }),
  ]);

  const policySnapshot = policy
    ? {
        yearlyFullDayLimit: policy.yearlyFullDayLimit,
        yearlyHalfDayLimit: policy.yearlyHalfDayLimit,
        halfDayMaxHours: Number(policy.halfDayMaxHours),
      }
    : defaultGermanyPolicy;

  const usage = calculateWorkLimitUsage(
    shifts.map((shift) => ({
      hours: calculateWorkedHours(
        shift.startTime,
        shift.endTime,
        shift.breakMinutes,
      ),
    })),
    policySnapshot,
  );

  return {
    countryCode: user.country,
    studentStatus: user.studentStatus,
    policy: policySnapshot,
    usage,
  };
}

async function assertWorkShiftOwner(userId: string, id: string) {
  const shift = await prisma.workShift.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!shift) {
    throw new HttpError(404, "NOT_FOUND", "Work shift not found");
  }
}
