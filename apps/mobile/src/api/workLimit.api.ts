import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient, unwrap } from "./apiClient";
import { useAuthStore } from "../store/authStore";
import { localDb } from "../storage/localDb";
import type {
  WorkLimitPeriodUnit,
  WorkLimitSettings,
  WorkLimitStatus,
  WorkLimitSummary,
  WorkLimitType,
  WorkLimitUnit,
} from "../types/work.types";

export type WorkLimitSettingsInput = Partial<{
  isLimitEnabled: boolean;
  limitType: WorkLimitType;
  limitValue: number | null;
  limitUnit: WorkLimitUnit | null;
  periodValue: number | null;
  periodUnit: WorkLimitPeriodUnit | null;
  warningPercentage: number;
  dangerPercentage: number;
  hasDismissedUnlimitedLimitBanner: boolean;
}>;

export const defaultWorkLimitSettings: WorkLimitSettings = {
  id: "local-work-limit",
  userId: "local",
  isLimitEnabled: false,
  limitType: "UNLIMITED",
  limitValue: null,
  limitUnit: null,
  periodValue: null,
  periodUnit: null,
  warningPercentage: 80,
  dangerPercentage: 95,
  hasDismissedUnlimitedLimitBanner: false,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export const defaultWorkLimitSummary: WorkLimitSummary = {
  isLimitEnabled: false,
  limitType: "UNLIMITED",
  limitUnit: null,
  limitValue: null,
  periodValue: null,
  periodUnit: null,
  warningPercentage: 80,
  dangerPercentage: 95,
  hasDismissedUnlimitedLimitBanner: false,
  limit: null,
  used: 0,
  remaining: null,
  percentageUsed: null,
  status: "UNLIMITED",
  monthlyAllowed: null,
  periodStart: null,
  periodEnd: null,
  usage: {
    usedFullDayUnits: 0,
    remainingFullDayUnits: 0,
    limitFullDayUnits: 0,
    percentUsed: 0,
    warningLevel: "ok",
  },
};

const localWorkLimitKey = "student-kit.work-limit";

function isAuthenticated() {
  return useAuthStore.getState().isAuthenticated;
}

function mergeWorkLimitSettings(
  input?: Partial<WorkLimitSettings>,
): WorkLimitSettings {
  const now = new Date().toISOString();
  const next: WorkLimitSettings = {
    ...defaultWorkLimitSettings,
    ...input,
    isLimitEnabled:
      input?.isLimitEnabled ?? defaultWorkLimitSettings.isLimitEnabled,
    limitType: input?.limitType ?? defaultWorkLimitSettings.limitType,
    limitValue: input?.limitValue ?? defaultWorkLimitSettings.limitValue,
    limitUnit: input?.limitUnit ?? defaultWorkLimitSettings.limitUnit,
    periodValue: input?.periodValue ?? defaultWorkLimitSettings.periodValue,
    periodUnit: input?.periodUnit ?? defaultWorkLimitSettings.periodUnit,
    warningPercentage:
      input?.warningPercentage ?? defaultWorkLimitSettings.warningPercentage,
    dangerPercentage:
      input?.dangerPercentage ?? defaultWorkLimitSettings.dangerPercentage,
    hasDismissedUnlimitedLimitBanner:
      input?.hasDismissedUnlimitedLimitBanner ??
      defaultWorkLimitSettings.hasDismissedUnlimitedLimitBanner,
    createdAt: input?.createdAt ?? defaultWorkLimitSettings.createdAt,
    updatedAt: now,
  };

  if (!next.isLimitEnabled || next.limitType === "UNLIMITED") {
    return {
      ...next,
      isLimitEnabled: false,
      limitType: "UNLIMITED",
      limitValue: null,
      limitUnit: null,
      periodValue: null,
      periodUnit: null,
    };
  }

  return next;
}

async function getLocalWorkLimitSettings() {
  const raw = await AsyncStorage.getItem(localWorkLimitKey);
  if (!raw) return defaultWorkLimitSettings;

  try {
    return mergeWorkLimitSettings(
      JSON.parse(raw) as Partial<WorkLimitSettings>,
    );
  } catch {
    await AsyncStorage.removeItem(localWorkLimitKey);
    return defaultWorkLimitSettings;
  }
}

async function saveLocalWorkLimitSettings(input: Partial<WorkLimitSettings>) {
  const next = mergeWorkLimitSettings({
    ...(await getLocalWorkLimitSettings()),
    ...input,
  });
  await AsyncStorage.setItem(localWorkLimitKey, JSON.stringify(next));
  return next;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getLocalPeriodRange(
  settings: WorkLimitSettings,
  anchorDate = new Date(),
) {
  const dayStart = startOfUtcDay(anchorDate);

  if (!settings.isLimitEnabled || settings.limitType === "UNLIMITED") {
    const monthStart = new Date(
      Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth() + 1, 1),
    );
    return {
      start: monthStart,
      end: monthEnd,
      periodStart: null as string | null,
      periodEnd: null as string | null,
    };
  }

  if (settings.periodUnit === "WEEK") {
    const dayOfWeek = dayStart.getUTCDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = addUtcDays(dayStart, -offset);
    const end = addUtcDays(start, 7);
    return {
      start,
      end,
      periodStart: start.toISOString(),
      periodEnd: addUtcDays(end, -1).toISOString(),
    };
  }

  if (settings.periodUnit === "MONTH") {
    const start = new Date(
      Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth() + 1, 1),
    );
    return {
      start,
      end,
      periodStart: start.toISOString(),
      periodEnd: addUtcDays(end, -1).toISOString(),
    };
  }

  if (settings.periodUnit === "YEAR") {
    const start = new Date(Date.UTC(dayStart.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(dayStart.getUTCFullYear() + 1, 0, 1));
    return {
      start,
      end,
      periodStart: start.toISOString(),
      periodEnd: addUtcDays(end, -1).toISOString(),
    };
  }

  const periodValue = Math.max(1, settings.periodValue ?? 1);
  const start = addUtcDays(dayStart, -(periodValue - 1));
  const end = addUtcDays(start, periodValue);
  return {
    start,
    end,
    periodStart: start.toISOString(),
    periodEnd: addUtcDays(end, -1).toISOString(),
  };
}

function buildLocalWorkLimitSummary(
  settings: WorkLimitSettings,
  shifts: Array<{
    date: string;
    calculatedHours?: number;
    calculatedIncome?: number;
  }>,
): WorkLimitSummary {
  const anchorDate = new Date();
  const { start, end, periodStart, periodEnd } = getLocalPeriodRange(
    settings,
    anchorDate,
  );
  const filtered = shifts.filter((shift) => {
    const date = new Date(`${shift.date}T12:00:00`);
    return date >= start && date < end;
  });
  const totalHours = filtered.reduce(
    (sum, shift) => sum + Number(shift.calculatedHours ?? 0),
    0,
  );
  const workedDays = new Set(
    filtered
      .filter((shift) => Number(shift.calculatedHours ?? 0) > 0)
      .map((shift) => shift.date),
  ).size;

  if (!settings.isLimitEnabled || settings.limitType === "UNLIMITED") {
    return {
      ...defaultWorkLimitSummary,
      hasDismissedUnlimitedLimitBanner:
        settings.hasDismissedUnlimitedLimitBanner,
      used: totalHours,
      usage: {
        ...defaultWorkLimitSummary.usage,
        usedFullDayUnits: totalHours,
      },
      periodStart,
      periodEnd,
    };
  }

  const limitValue = Number(settings.limitValue ?? 0);
  const used = settings.limitUnit === "DAYS" ? workedDays : totalHours;
  const percentageUsed =
    limitValue > 0 ? Math.round((used / limitValue) * 100 * 10) / 10 : 0;
  const remaining = Math.max(0, Math.round((limitValue - used) * 10) / 10);
  const status: WorkLimitStatus =
    percentageUsed >= 100
      ? "EXCEEDED"
      : percentageUsed >= settings.dangerPercentage
        ? "DANGER"
        : percentageUsed >= settings.warningPercentage
          ? "WARNING"
          : "SAFE";

  const monthlyAllowed =
    settings.limitUnit === "HOURS"
      ? Math.round(
          limitValue *
            (settings.periodUnit === "WEEK"
              ? 4
              : settings.periodUnit === "MONTH"
                ? 1
                : settings.periodUnit === "YEAR"
                  ? 1 / 12
                  : 30 / Math.max(1, settings.periodValue ?? 1)) *
            10,
        ) / 10
      : null;

  return {
    isLimitEnabled: true,
    limitType: "CUSTOM",
    limitUnit: settings.limitUnit,
    limitValue,
    periodValue: settings.periodValue ?? null,
    periodUnit: settings.periodUnit ?? null,
    warningPercentage: settings.warningPercentage,
    dangerPercentage: settings.dangerPercentage,
    hasDismissedUnlimitedLimitBanner: settings.hasDismissedUnlimitedLimitBanner,
    limit: limitValue,
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
      limitFullDayUnits: limitValue,
      percentUsed: percentageUsed,
      warningLevel:
        status === "EXCEEDED"
          ? "exceeded"
          : status === "DANGER"
            ? "critical"
            : status === "WARNING"
              ? "near"
              : "ok",
    },
  };
}

export const workLimitApi = {
  async getSettings() {
    if (!isAuthenticated()) {
      return getLocalWorkLimitSettings();
    }

    try {
      return unwrap<WorkLimitSettings>(await apiClient.get("/work-limit"));
    } catch {
      return defaultWorkLimitSettings;
    }
  },
  async getSummary() {
    if (!isAuthenticated()) {
      const settings = await getLocalWorkLimitSettings();
      const shifts = await localDb.list("workEntries");
      return buildLocalWorkLimitSummary(
        settings,
        shifts as Array<{
          date: string;
          calculatedHours?: number;
          calculatedIncome?: number;
        }>,
      );
    }

    try {
      return unwrap<WorkLimitSummary>(
        await apiClient.get("/work-limit/summary"),
      );
    } catch {
      return defaultWorkLimitSummary;
    }
  },
  async saveSettings(input: WorkLimitSettingsInput) {
    if (!isAuthenticated()) {
      return saveLocalWorkLimitSettings(input);
    }

    return unwrap<WorkLimitSettings>(await apiClient.put("/work-limit", input));
  },
  async resetToUnlimited() {
    if (!isAuthenticated()) {
      return saveLocalWorkLimitSettings({
        ...defaultWorkLimitSettings,
        isLimitEnabled: false,
        limitType: "UNLIMITED",
        limitValue: null,
        limitUnit: null,
        periodValue: null,
        periodUnit: null,
      });
    }

    return unwrap<WorkLimitSettings>(await apiClient.post("/work-limit/reset"));
  },
  async dismissUnlimitedBanner() {
    if (!isAuthenticated()) {
      return saveLocalWorkLimitSettings({
        hasDismissedUnlimitedLimitBanner: true,
      });
    }

    return unwrap<WorkLimitSettings>(
      await apiClient.post("/work-limit/banner/dismiss"),
    );
  },
};

export function mapWorkLimitStatusToTone(status: WorkLimitStatus) {
  if (status === "EXCEEDED") return "danger" as const;
  if (status === "DANGER") return "danger" as const;
  if (status === "WARNING") return "warning" as const;
  if (status === "SAFE") return "success" as const;
  return "muted" as const;
}
