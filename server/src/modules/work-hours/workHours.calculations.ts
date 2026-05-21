import type { BonusType } from "@prisma/client";
import { timeToMinutes } from "../../utils/date.js";

export type WorkLimitPolicySnapshot = {
  yearlyFullDayLimit: number;
  yearlyHalfDayLimit: number;
  halfDayMaxHours: number;
};

export type WorkLimitUsage = {
  totalHours: number;
  usedFullDayUnits: number;
  remainingFullDayUnits: number;
  limitFullDayUnits: number;
  percentUsed: number;
  warningLevel: "ok" | "near" | "critical" | "exceeded";
};

export function calculateWorkedHours(startTime: Date, endTime: Date, breakMinutes: number) {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const workedMinutes = endMinutes - startMinutes - breakMinutes;

  if (workedMinutes <= 0) {
    return 0;
  }

  return roundHours(workedMinutes / 60);
}

export function calculateIncome(
  hours: number,
  hourlyWage: number,
  bonusType: BonusType,
  bonusValue?: number | null
) {
  const baseIncome = hours * hourlyWage;
  const value = bonusValue ?? 0;

  if (bonusType === "DOUBLE") {
    return roundMoney(baseIncome * 2);
  }

  if (bonusType === "PERCENTAGE" || bonusType === "NIGHT_SHIFT") {
    return roundMoney(baseIncome + (baseIncome * value) / 100);
  }

  if (bonusType === "FIXED" || bonusType === "CUSTOM") {
    return roundMoney(baseIncome + value);
  }

  return roundMoney(baseIncome);
}

export function calculateWorkLimitUsage(
  shifts: Array<{ hours: number }>,
  policy: WorkLimitPolicySnapshot
): WorkLimitUsage {
  const totalHours = roundHours(shifts.reduce((sum, shift) => sum + shift.hours, 0));
  const usedFullDayUnits = shifts.reduce((sum, shift) => {
    if (shift.hours <= 0) {
      return sum;
    }

    return sum + (shift.hours <= policy.halfDayMaxHours ? 0.5 : 1);
  }, 0);
  const limitFullDayUnits = policy.yearlyFullDayLimit;
  const remainingFullDayUnits = roundHours(limitFullDayUnits - usedFullDayUnits);
  const percentUsed = limitFullDayUnits > 0 ? roundHours((usedFullDayUnits / limitFullDayUnits) * 100) : 0;

  let warningLevel: WorkLimitUsage["warningLevel"] = "ok";

  if (usedFullDayUnits > limitFullDayUnits) {
    warningLevel = "exceeded";
  } else if (percentUsed >= 95) {
    warningLevel = "critical";
  } else if (percentUsed >= 80) {
    warningLevel = "near";
  }

  return {
    totalHours,
    usedFullDayUnits,
    remainingFullDayUnits,
    limitFullDayUnits,
    percentUsed,
    warningLevel
  };
}

export function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

