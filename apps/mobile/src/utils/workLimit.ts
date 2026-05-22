import type { AppSettings } from "../api/settings.api";
import type { WorkLimitSettings, WorkLimitSummary } from "../types/work.types";

export type WorkLimitTone = "success" | "warning" | "danger" | "muted";

export type WorkLimitOverview = {
  title: string;
  limitLabel: string;
  description: string;
  usedLabel: string | null;
  remainingLabel: string | null;
  monthlyAllowedLabel: string | null;
  actionLabel: string;
  statusLabel: string;
  statusTone: WorkLimitTone;
  percentUsed: number;
  status: WorkLimitSummary["status"];
};

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPeriodLabel(
  periodUnit: WorkLimitSettings["periodUnit"],
  periodValue: number | null,
) {
  if (!periodUnit) return "";
  if (periodUnit === "CUSTOM_DAYS") {
    return `${formatNumber(periodValue ?? 1)} custom days`;
  }
  return periodUnit.toLowerCase();
}

function getStatusTone(status: WorkLimitSummary["status"]): WorkLimitTone {
  if (status === "EXCEEDED" || status === "DANGER") return "danger";
  if (status === "WARNING") return "warning";
  if (status === "SAFE") return "success";
  return "muted";
}

export function describeWorkLimit(settings: Pick<AppSettings, "work">) {
  const work = settings.work;
  if (work.workLimitMode === "WEEKLY_HOURS") {
    return `${work.weeklyWorkLimitHours ?? 20} hours/week`;
  }
  return `${work.yearlyWorkLimitDays ?? 140} days/year`;
}

export function describeWorkLimitSettings(
  settings: Pick<
    WorkLimitSettings,
    | "isLimitEnabled"
    | "limitType"
    | "limitValue"
    | "limitUnit"
    | "periodValue"
    | "periodUnit"
  >,
) {
  if (!settings.isLimitEnabled || settings.limitType === "UNLIMITED") {
    return "Unlimited";
  }

  if (settings.limitUnit === "DAYS") {
    return `${formatNumber(settings.limitValue ?? 0)} days per ${formatPeriodLabel(settings.periodUnit, settings.periodValue)}`;
  }

  return `${formatNumber(settings.limitValue ?? 0)} hours per ${formatPeriodLabel(settings.periodUnit, settings.periodValue)}`;
}

export function getWorkLimitOverview(
  summary: WorkLimitSummary,
): WorkLimitOverview {
  const statusTone = getStatusTone(summary.status);

  if (!summary.isLimitEnabled || summary.limitType === "UNLIMITED") {
    return {
      title: "Work Limit",
      limitLabel: "Unlimited",
      description:
        "You are only tracking work hours. No work restriction limit is active.",
      usedLabel: null,
      remainingLabel: null,
      monthlyAllowedLabel: null,
      actionLabel: "Set student work limit",
      statusLabel: "Unlimited",
      statusTone,
      percentUsed: 0,
      status: "UNLIMITED",
    };
  }

  const limitUnitLabel = summary.limitUnit === "DAYS" ? "days" : "hours";
  const periodLabel = formatPeriodLabel(
    summary.periodUnit,
    summary.periodValue,
  );
  const limitText = `${formatNumber(summary.limitValue ?? 0)} ${limitUnitLabel} per ${periodLabel}`;
  const usedText = `Used this period: ${formatNumber(summary.used)} ${limitUnitLabel}`;
  const remainingText = `Remaining this period: ${formatNumber(summary.remaining ?? 0)} ${limitUnitLabel}`;

  return {
    title: "Work Limit",
    limitLabel: limitText,
    description:
      summary.limitUnit === "HOURS"
        ? "Track how many hours you can work in the current period."
        : "Track how many work days you can use in the current period.",
    usedLabel: usedText,
    remainingLabel: remainingText,
    monthlyAllowedLabel:
      summary.monthlyAllowed !== null && summary.limitUnit === "HOURS"
        ? `Approx. monthly allowed: ${formatNumber(summary.monthlyAllowed)} hours`
        : null,
    actionLabel: "Edit student work limit",
    statusLabel: summary.status,
    statusTone,
    percentUsed: summary.percentageUsed ?? 0,
    status: summary.status,
  };
}
