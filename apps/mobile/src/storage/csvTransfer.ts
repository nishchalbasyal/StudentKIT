import { exportLocalWorkLimitSettings, importLocalWorkLimitSettings } from "../api/workLimit.api";
import { localDb } from "./localDb";
import {
  getLocalSettings,
  saveLocalSettings,
  getOnboardingPreferences,
  saveOnboardingPreferences,
} from "./settingsStorage";
import { useAuthStore } from "../store/authStore";
import { buildExportUser } from "../utils/profileData";
import type { Reminder } from "../types/reminder.types";
import type { WorkShift } from "../types/work.types";

type CsvRow = Record<string, string>;

const csvColumns = [
  "rowType",
  "id",
  "name",
  "username",
  "email",
  "avatarUrl",
  "country",
  "currency",
  "studentStatus",
  "hourlyWageDefault",
  "workCountry",
  "workLimitMode",
  "yearlyWorkLimitDays",
  "weeklyWorkLimitHours",
  "limitType",
  "limitValue",
  "limitUnit",
  "periodValue",
  "periodUnit",
  "warningPercentage",
  "dangerPercentage",
  "date",
  "startTime",
  "endTime",
  "breakMinutes",
  "jobName",
  "companyId",
  "hourlyWage",
  "bonusType",
  "bonusValue",
  "isPublicHoliday",
  "notes",
  "calculatedHours",
  "calculatedIncome",
  "scheduledAt",
  "title",
  "message",
  "reminderType",
  "isCompleted",
  "linkedEntityType",
  "linkedEntityId",
] as const;

function escapeCsvCell(value: unknown) {
  const normalized = String(value ?? "");
  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? "";
    const next = text[index + 1] ?? "";

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function toCsvRow(values: Partial<CsvRow>) {
  return csvColumns.map((column) => escapeCsvCell(values[column] ?? "")).join(",");
}

function toBooleanString(value: boolean | null | undefined) {
  return value ? "true" : "false";
}

function toNumberString(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableBoolean(value: string) {
  if (!value.trim()) return null;
  return value.toLowerCase() === "true";
}

function getCell(row: CsvRow, key: string) {
  return row[key] ?? "";
}

export async function exportAppCsv() {
  const [settings, onboarding, workLimit, workEntries, reminders] = await Promise.all([
    getLocalSettings(),
    getOnboardingPreferences(),
    exportLocalWorkLimitSettings(),
    localDb.list("workEntries"),
    localDb.list("reminders"),
  ]);

  const user = buildExportUser(useAuthStore.getState().user);
  const lines = [csvColumns.join(",")];

  lines.push(
    toCsvRow({
      rowType: "PROFILE",
      id: user?.id ?? "guest",
      name: user?.name ?? "Guest Student",
      username: user?.username ?? "",
      email: user?.email ?? "Guest mode",
      avatarUrl: user?.avatarUrl ?? "",
      country: user?.country ?? "DE",
      currency: user?.currency ?? settings.preferences.currency,
      studentStatus: user?.studentStatus ?? "INTERNATIONAL",
      hourlyWageDefault: toNumberString(user?.hourlyWageDefault ?? null),
      workCountry: settings.work.workCountry,
      workLimitMode: settings.work.workLimitMode,
      yearlyWorkLimitDays: toNumberString(settings.work.yearlyWorkLimitDays),
      weeklyWorkLimitHours: toNumberString(settings.work.weeklyWorkLimitHours ?? null),
    }),
  );

  lines.push(
    toCsvRow({
      rowType: "WORK_LIMIT",
      id: workLimit.id,
      limitType: workLimit.limitType,
      limitValue: toNumberString(workLimit.limitValue),
      limitUnit: workLimit.limitUnit ?? "",
      periodValue: toNumberString(workLimit.periodValue),
      periodUnit: workLimit.periodUnit ?? "",
      warningPercentage: toNumberString(workLimit.warningPercentage),
      dangerPercentage: toNumberString(workLimit.dangerPercentage),
    }),
  );

  for (const entry of workEntries as WorkShift[]) {
    lines.push(
      toCsvRow({
        rowType: "WORK_ENTRY",
        id: entry.id,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        breakMinutes: toNumberString(entry.breakMinutes),
        jobName: entry.jobName,
        companyId: entry.companyId ?? "",
        hourlyWage: toNumberString(entry.hourlyWage),
        bonusType: entry.bonusType,
        bonusValue: toNumberString(entry.bonusValue ?? null),
        isPublicHoliday: toBooleanString(entry.isPublicHoliday),
        notes: entry.notes ?? "",
        calculatedHours: toNumberString(entry.calculatedHours),
        calculatedIncome: toNumberString(entry.calculatedIncome),
      }),
    );
  }

  for (const reminder of reminders as Reminder[]) {
    lines.push(
      toCsvRow({
        rowType: "REMINDER",
        id: reminder.id,
        scheduledAt: reminder.scheduledAt,
        title: reminder.title,
        message: reminder.message ?? "",
        reminderType: reminder.type,
        isCompleted: toBooleanString(reminder.isCompleted),
        linkedEntityType: reminder.linkedEntityType ?? "",
        linkedEntityId: reminder.linkedEntityId ?? "",
      }),
    );
  }

  lines.push(
    toCsvRow({
      rowType: "MODULES",
      notes: JSON.stringify(onboarding.userEnabledModules),
    }),
  );

  return lines.join("\n");
}

export async function importAppCsv(text: string) {
  const rows = parseCsv(text.trim());
  if (rows.length < 2) {
    throw new Error("CSV must include a header and at least one row.");
  }

  const header = rows[0] ?? [];
  const dataRows = rows.slice(1).map((values) => {
    const row = {} as CsvRow;
    header.forEach((key, index) => {
      row[key] = values[index] ?? "";
    });
    return row;
  });

  const profileRow = dataRows.find((row) => row.rowType === "PROFILE");
  const workLimitRow = dataRows.find((row) => row.rowType === "WORK_LIMIT");
  const modulesRow = dataRows.find((row) => row.rowType === "MODULES");
  const workEntries = dataRows.filter((row) => row.rowType === "WORK_ENTRY");
  const reminders = dataRows.filter((row) => row.rowType === "REMINDER");

  if (profileRow) {
    const current = await getLocalSettings();
    await saveLocalSettings({
      ...current,
      preferences: {
        ...current.preferences,
        currency: profileRow.currency || current.preferences.currency,
      },
      work: {
        ...current.work,
        workCountry:
          getCell(profileRow, "workCountry") ||
          getCell(profileRow, "country") ||
          current.work.workCountry,
        workLimitMode:
          (getCell(profileRow, "workLimitMode") as typeof current.work.workLimitMode) ||
          current.work.workLimitMode,
        yearlyWorkLimitDays:
          toNullableNumber(getCell(profileRow, "yearlyWorkLimitDays")) ??
          current.work.yearlyWorkLimitDays,
        weeklyWorkLimitHours: toNullableNumber(getCell(profileRow, "weeklyWorkLimitHours")),
        defaultHourlyWage: toNullableNumber(getCell(profileRow, "hourlyWageDefault")),
      },
    });

    await useAuthStore.getState().setUser({
      id: getCell(profileRow, "id") || "guest",
      name: getCell(profileRow, "name") || "Guest Student",
      username: getCell(profileRow, "username") || null,
      email: getCell(profileRow, "email") || "Guest mode",
      avatarUrl: getCell(profileRow, "avatarUrl") || null,
      country: getCell(profileRow, "country") || "DE",
      currency: getCell(profileRow, "currency") || current.preferences.currency,
      studentStatus:
        (getCell(profileRow, "studentStatus") as "INTERNATIONAL" | "EU_EEA_SWISS" | "GERMAN" | "OTHER") ||
        "INTERNATIONAL",
      hourlyWageDefault: toNullableNumber(getCell(profileRow, "hourlyWageDefault")),
      university: null,
      course: null,
    });
  }

  if (workLimitRow) {
    await importLocalWorkLimitSettings({
      limitType:
        (getCell(workLimitRow, "limitType") as "UNLIMITED" | "CUSTOM") || "UNLIMITED",
      isLimitEnabled: getCell(workLimitRow, "limitType") !== "UNLIMITED",
      limitValue: toNullableNumber(getCell(workLimitRow, "limitValue")),
      limitUnit:
        (getCell(workLimitRow, "limitUnit") as "HOURS" | "DAYS" | "") || null,
      periodValue: toNullableNumber(getCell(workLimitRow, "periodValue")),
      periodUnit:
        (getCell(workLimitRow, "periodUnit") as "WEEK" | "MONTH" | "YEAR" | "CUSTOM_DAYS" | "") ||
        null,
      warningPercentage: toNullableNumber(getCell(workLimitRow, "warningPercentage")) ?? 80,
      dangerPercentage: toNullableNumber(getCell(workLimitRow, "dangerPercentage")) ?? 95,
    });
  }

  await localDb.replace(
    "workEntries",
    workEntries.map((row) => ({
      id: getCell(row, "id"),
      companyId: getCell(row, "companyId") || null,
      jobName: getCell(row, "jobName"),
      date: getCell(row, "date"),
      startTime: getCell(row, "startTime"),
      endTime: getCell(row, "endTime"),
      breakMinutes: toNullableNumber(getCell(row, "breakMinutes")) ?? 0,
      hourlyWage: toNullableNumber(getCell(row, "hourlyWage")) ?? 0,
      bonusType:
        (getCell(row, "bonusType") as WorkShift["bonusType"]) || "NONE",
      bonusValue: toNullableNumber(getCell(row, "bonusValue")),
      isPublicHoliday: toNullableBoolean(getCell(row, "isPublicHoliday")) ?? false,
      notes: getCell(row, "notes") || null,
      calculatedHours: toNullableNumber(getCell(row, "calculatedHours")) ?? 0,
      calculatedIncome: toNullableNumber(getCell(row, "calculatedIncome")) ?? 0,
    })),
  );

  await localDb.replace(
    "reminders",
    reminders.map((row) => ({
      id: getCell(row, "id"),
      title: getCell(row, "title"),
      message: getCell(row, "message") || null,
      type:
        (getCell(row, "reminderType") as Reminder["type"]) || "CUSTOM",
      scheduledAt: getCell(row, "scheduledAt"),
      isCompleted: toNullableBoolean(getCell(row, "isCompleted")) ?? false,
      linkedEntityType: getCell(row, "linkedEntityType") || null,
      linkedEntityId: getCell(row, "linkedEntityId") || null,
    })),
  );

  if (modulesRow?.notes) {
    try {
      const parsed = JSON.parse(modulesRow.notes) as Record<string, boolean>;
      await saveOnboardingPreferences({
        userEnabledModules: {
          ...(await getOnboardingPreferences()).userEnabledModules,
          ...parsed,
        },
      });
    } catch {
      // Ignore malformed module metadata rows.
    }
  }
}
