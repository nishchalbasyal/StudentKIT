export type BonusType =
  | "NONE"
  | "DOUBLE"
  | "PERCENTAGE"
  | "FIXED"
  | "NIGHT_SHIFT"
  | "CUSTOM";

export type WorkLimitType = "UNLIMITED" | "CUSTOM";
export type WorkLimitUnit = "HOURS" | "DAYS";
export type WorkLimitPeriodUnit = "WEEK" | "MONTH" | "YEAR" | "CUSTOM_DAYS";
export type WorkLimitStatus =
  | "UNLIMITED"
  | "SAFE"
  | "WARNING"
  | "DANGER"
  | "EXCEEDED";

export type WorkShift = {
  id: string;
  companyId?: string | null;
  jobName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyWage: number;
  bonusType: BonusType;
  bonusValue?: number | null;
  isPublicHoliday: boolean;
  notes?: string | null;
  calculatedHours: number;
  calculatedIncome: number;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
};

export type WorkLimitUsage = {
  usedFullDayUnits: number;
  remainingFullDayUnits: number;
  limitFullDayUnits: number;
  percentUsed: number;
  warningLevel: "ok" | "near" | "critical" | "exceeded";
};

export type WorkLimitSettings = {
  id: string;
  userId: string;
  isLimitEnabled: boolean;
  limitType: WorkLimitType;
  limitValue: number | null;
  limitUnit: WorkLimitUnit | null;
  periodValue: number | null;
  periodUnit: WorkLimitPeriodUnit | null;
  warningPercentage: number;
  dangerPercentage: number;
  hasDismissedUnlimitedLimitBanner: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkLimitSummary = {
  isLimitEnabled: boolean;
  limitType: WorkLimitType;
  limitUnit: WorkLimitUnit | null;
  limitValue: number | null;
  periodValue: number | null;
  periodUnit: WorkLimitPeriodUnit | null;
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
  usage: WorkLimitUsage;
};

export type CompanyWorkSummary = {
  companyId: string | null;
  companyName: string;
  totalHours: number;
  totalIncome: number;
  averageHourlyIncome: number;
  shiftCount: number;
};

export type WorkSummary = {
  year: number;
  month: number;
  monthKey?: string;
  totalHours: number;
  totalIncome: number;
  shiftCount: number;
  remainingLimitDays?: number | null;
  remainingLimitHours?: number | null;
  companies?: CompanyWorkSummary[];
  workLimit: WorkLimitSummary & {
    countryCode?: string;
    studentStatus?: string;
  };
  shifts: WorkShift[];
};

export type WorkShiftInput = {
  companyId?: string | null;
  jobName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyWage: number;
  bonusType: BonusType;
  bonusValue?: number;
  isPublicHoliday: boolean;
  notes?: string;
};
