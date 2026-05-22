import type { WorkLimitSettings } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import {
  addDays,
  getMonthRange,
  getWeekRange,
  getYearRange,
  parseDateOnly,
  toDateOnlyString,
} from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import {
  calculateWorkedHours,
  roundHours,
} from "../work-hours/workHours.calculations.js";
import type { WorkLimitSettingsInput } from "./workLimit.schemas.js";

type WorkLimitStatus = "UNLIMITED" | "SAFE" | "WARNING" | "DANGER" | "EXCEEDED";

type WorkLimitSummary = {
  isLimitEnabled: boolean;
  limitType: "UNLIMITED" | "CUSTOM";
  limitUnit: "HOURS" | "DAYS" | null;
  limitValue: number | null;
  periodValue: number | null;
  periodUnit: "WEEK" | "MONTH" | "YEAR" | "CUSTOM_DAYS" | null;
  warningPercentage: number;
  dangerPercentage: number;
  hasDismissedUnlimitedLimitBanner: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  percentageUsed: number | null;
  status: WorkLimitStatus;
  monthlyAllowed: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  usage: {
    usedFullDayUnits: number;
    remainingFullDayUnits: number;
    limitFullDayUnits: number;
    percentUsed: number;
    warningLevel: "ok" | "near" | "critical" | "exceeded";
  };
};

type WorkLimitSettingsRecord = Pick<
  WorkLimitSettings,
  | "id"
  | "userId"
  | "isLimitEnabled"
  | "limitType"
  | "limitValue"
  | "limitUnit"
  | "periodValue"
  | "periodUnit"
  | "warningPercentage"
  | "dangerPercentage"
  | "hasDismissedUnlimitedLimitBanner"
  | "createdAt"
  | "updatedAt"
>;

const defaultLimitSettings = {
  isLimitEnabled: false,
  limitType: "UNLIMITED" as const,
  limitValue: null,
  limitUnit: null,
  periodValue: null,
  periodUnit: null,
  warningPercentage: 80,
  dangerPercentage: 95,
  hasDismissedUnlimitedLimitBanner: false,
};

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function mapWarningLevel(status: WorkLimitStatus) {
  if (status === "EXCEEDED") return "exceeded" as const;
  if (status === "DANGER") return "critical" as const;
  if (status === "WARNING") return "near" as const;
  return "ok" as const;
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function serializeSettings(record: WorkLimitSettingsRecord) {
  return {
    id: record.id,
    userId: record.userId,
    isLimitEnabled: record.isLimitEnabled,
    limitType: record.limitType,
    limitValue: normalizeNumber(record.limitValue),
    limitUnit: record.limitUnit,
    periodValue: record.periodValue ?? null,
    periodUnit: record.periodUnit,
    warningPercentage: record.warningPercentage,
    dangerPercentage: record.dangerPercentage,
    hasDismissedUnlimitedLimitBanner: record.hasDismissedUnlimitedLimitBanner,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildUnlimitedSettings() {
  return {
    ...defaultLimitSettings,
    isLimitEnabled: false,
    limitType: "UNLIMITED" as const,
    limitValue: null,
    limitUnit: null,
    periodValue: null,
    periodUnit: null,
  };
}

function validateSettings(
  input: WorkLimitSettingsInput,
  current: WorkLimitSettingsRecord,
) {
  const nextWarning = input.warningPercentage ?? current.warningPercentage;
  const nextDanger = input.dangerPercentage ?? current.dangerPercentage;

  if (nextWarning >= nextDanger) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Warning percentage must be less than danger percentage.",
    );
  }

  if (nextDanger > 100) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Danger percentage must be 100 or less.",
    );
  }

  const enabled = input.isLimitEnabled ?? current.isLimitEnabled;
  const limitType = input.limitType ?? current.limitType;

  if (!enabled || limitType === "UNLIMITED") {
    return {
      ...buildUnlimitedSettings(),
      warningPercentage: nextWarning,
      dangerPercentage: nextDanger,
      hasDismissedUnlimitedLimitBanner:
        input.hasDismissedUnlimitedLimitBanner ??
        current.hasDismissedUnlimitedLimitBanner,
    };
  }

  const limitValue = input.limitValue ?? normalizeNumber(current.limitValue);
  const limitUnit = input.limitUnit ?? current.limitUnit;
  const periodValue = input.periodValue ?? current.periodValue;
  const periodUnit = input.periodUnit ?? current.periodUnit;

  if (limitValue === null || !Number.isFinite(limitValue) || limitValue <= 0) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Limit value must be positive.",
    );
  }

  if (limitUnit !== "HOURS" && limitUnit !== "DAYS") {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Limit unit must be HOURS or DAYS.",
    );
  }

  if (
    periodValue === null ||
    !Number.isFinite(periodValue) ||
    periodValue <= 0
  ) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Period value must be positive.",
    );
  }

  if (
    periodUnit !== "WEEK" &&
    periodUnit !== "MONTH" &&
    periodUnit !== "YEAR" &&
    periodUnit !== "CUSTOM_DAYS"
  ) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Period unit must be WEEK, MONTH, YEAR, or CUSTOM_DAYS.",
    );
  }

  return {
    isLimitEnabled: true,
    limitType: "CUSTOM" as const,
    limitValue,
    limitUnit,
    periodValue: Math.round(periodValue),
    periodUnit,
    warningPercentage: nextWarning,
    dangerPercentage: nextDanger,
    hasDismissedUnlimitedLimitBanner:
      input.hasDismissedUnlimitedLimitBanner ??
      current.hasDismissedUnlimitedLimitBanner,
  };
}

async function ensureWorkLimitSettings(userId: string) {
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.workLimitSettings.findUnique({ where: { userId } }),
  ]);

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "User not found");
  }

  if (settings) {
    return settings;
  }

  return prisma.workLimitSettings.create({
    data: {
      userId,
      ...defaultLimitSettings,
    },
  });
}

async function getShiftsForRange(userId: string, start: Date, end: Date) {
  return prisma.workShift.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    select: {
      date: true,
      startTime: true,
      endTime: true,
      breakMinutes: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

function calculatePeriodRange(
  settings: WorkLimitSettingsRecord,
  anchorDate: Date,
) {
  const dayStart = parseDateOnly(toDateOnlyString(anchorDate));

  if (!settings.isLimitEnabled || settings.limitType === "UNLIMITED") {
    const { start, end } = getMonthRange(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth() + 1,
    );
    return { start, end, periodStart: null, periodEnd: null };
  }

  if (settings.periodUnit === "WEEK") {
    const { start, end } = getWeekRange(dayStart);
    return {
      start,
      end,
      periodStart: toDateOnlyString(start),
      periodEnd: toDateOnlyString(new Date(end.getTime() - 1)),
    };
  }

  if (settings.periodUnit === "MONTH") {
    const { start, end } = getMonthRange(
      dayStart.getUTCFullYear(),
      dayStart.getUTCMonth() + 1,
    );
    return {
      start,
      end,
      periodStart: toDateOnlyString(start),
      periodEnd: toDateOnlyString(new Date(end.getTime() - 1)),
    };
  }

  if (settings.periodUnit === "YEAR") {
    const { start, end } = getYearRange(dayStart.getUTCFullYear());
    return {
      start,
      end,
      periodStart: toDateOnlyString(start),
      periodEnd: toDateOnlyString(new Date(end.getTime() - 1)),
    };
  }

  const periodValue = Math.max(1, settings.periodValue ?? 1);
  const start = addDays(dayStart, -(periodValue - 1));
  const end = addDays(start, periodValue);
  return {
    start,
    end,
    periodStart: toDateOnlyString(start),
    periodEnd: toDateOnlyString(new Date(end.getTime() - 1)),
  };
}

function buildSummary(
  settings: WorkLimitSettingsRecord,
  shifts: Array<{
    date: Date;
    startTime: Date;
    endTime: Date;
    breakMinutes: number;
  }>,
  periodStart: string | null,
  periodEnd: string | null,
): WorkLimitSummary {
  const hoursByShift = shifts.map((shift) => ({
    dateKey: toDateOnlyString(shift.date),
    hours: calculateWorkedHours(
      shift.startTime,
      shift.endTime,
      shift.breakMinutes,
    ),
  }));
  const totalHours = roundHours(
    hoursByShift.reduce((sum, shift) => sum + shift.hours, 0),
  );
  const workedDays = new Set(
    hoursByShift
      .filter((shift) => shift.hours > 0)
      .map((shift) => shift.dateKey),
  ).size;

  if (!settings.isLimitEnabled || settings.limitType === "UNLIMITED") {
    return {
      isLimitEnabled: false,
      limitType: "UNLIMITED",
      limitUnit: null,
      limitValue: null,
      periodValue: null,
      periodUnit: null,
      warningPercentage: settings.warningPercentage,
      dangerPercentage: settings.dangerPercentage,
      hasDismissedUnlimitedLimitBanner:
        settings.hasDismissedUnlimitedLimitBanner,
      limit: null,
      used: totalHours,
      remaining: null,
      percentageUsed: null,
      status: "UNLIMITED",
      monthlyAllowed: null,
      periodStart,
      periodEnd,
      usage: {
        usedFullDayUnits: totalHours,
        remainingFullDayUnits: 0,
        limitFullDayUnits: 0,
        percentUsed: 0,
        warningLevel: "ok",
      },
    };
  }

  const limitValue = normalizeNumber(settings.limitValue);
  const periodValue = settings.periodValue ?? null;
  const limitUnit = settings.limitUnit ?? null;
  const used = limitUnit === "DAYS" ? workedDays : totalHours;
  const limit = limitValue ?? 0;
  const percentageUsed =
    limit > 0 ? roundToOneDecimal((used / limit) * 100) : 0;
  const remaining = Math.max(0, roundToOneDecimal(limit - used));
  let status: WorkLimitStatus = "SAFE";

  if (percentageUsed >= 100) {
    status = "EXCEEDED";
  } else if (percentageUsed >= settings.dangerPercentage) {
    status = "DANGER";
  } else if (percentageUsed >= settings.warningPercentage) {
    status = "WARNING";
  }

  const monthlyAllowed =
    limitUnit === "HOURS"
      ? roundToOneDecimal(
          limit *
            (settings.periodUnit === "WEEK"
              ? 4
              : settings.periodUnit === "MONTH"
                ? 1
                : settings.periodUnit === "YEAR"
                  ? 1 / 12
                  : 30 / Math.max(1, periodValue ?? 1)),
        )
      : null;

  return {
    isLimitEnabled: true,
    limitType: "CUSTOM",
    limitUnit,
    limitValue,
    periodValue,
    periodUnit: settings.periodUnit ?? null,
    warningPercentage: settings.warningPercentage,
    dangerPercentage: settings.dangerPercentage,
    hasDismissedUnlimitedLimitBanner: settings.hasDismissedUnlimitedLimitBanner,
    limit,
    used,
    remaining,
    percentageUsed,
    status,
    monthlyAllowed,
    periodStart,
    periodEnd,
    usage: {
      usedFullDayUnits: used,
      remainingFullDayUnits: remaining,
      limitFullDayUnits: limit,
      percentUsed: percentageUsed,
      warningLevel: mapWarningLevel(status),
    },
  };
}

export async function getWorkLimitSettings(userId: string) {
  return serializeSettings(
    (await ensureWorkLimitSettings(userId)) as WorkLimitSettingsRecord,
  );
}

export async function saveWorkLimitSettings(
  userId: string,
  input: WorkLimitSettingsInput,
) {
  const current = (await ensureWorkLimitSettings(
    userId,
  )) as WorkLimitSettingsRecord;
  const normalized = validateSettings(input, current);

  const updated = await prisma.workLimitSettings.update({
    where: { userId },
    data: {
      isLimitEnabled: normalized.isLimitEnabled,
      limitType: normalized.limitType,
      limitValue: normalized.limitValue,
      limitUnit: normalized.limitUnit,
      periodValue: normalized.periodValue,
      periodUnit: normalized.periodUnit,
      warningPercentage: normalized.warningPercentage,
      dangerPercentage: normalized.dangerPercentage,
      hasDismissedUnlimitedLimitBanner:
        normalized.hasDismissedUnlimitedLimitBanner,
    },
  });

  return serializeSettings(updated as WorkLimitSettingsRecord);
}

export async function resetWorkLimitSettings(userId: string) {
  const current = (await ensureWorkLimitSettings(
    userId,
  )) as WorkLimitSettingsRecord;
  const updated = await prisma.workLimitSettings.update({
    where: { userId },
    data: {
      ...buildUnlimitedSettings(),
      hasDismissedUnlimitedLimitBanner:
        current.hasDismissedUnlimitedLimitBanner,
      warningPercentage: current.warningPercentage,
      dangerPercentage: current.dangerPercentage,
    },
  });

  return serializeSettings(updated as WorkLimitSettingsRecord);
}

export async function dismissUnlimitedBanner(userId: string) {
  await ensureWorkLimitSettings(userId);
  const updated = await prisma.workLimitSettings.update({
    where: { userId },
    data: { hasDismissedUnlimitedLimitBanner: true },
  });

  return serializeSettings(updated as WorkLimitSettingsRecord);
}

export async function getCurrentWorkLimitSummary(
  userId: string,
): Promise<WorkLimitSummary> {
  const settings = (await ensureWorkLimitSettings(
    userId,
  )) as WorkLimitSettingsRecord;
  const anchorDate = new Date();
  const { start, end, periodStart, periodEnd } = calculatePeriodRange(
    settings,
    anchorDate,
  );
  const shifts = await getShiftsForRange(userId, start, end);

  return buildSummary(settings, shifts, periodStart, periodEnd);
}
