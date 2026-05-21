export type BonusType =
  | "NONE"
  | "DOUBLE"
  | "PERCENTAGE"
  | "FIXED"
  | "NIGHT_SHIFT"
  | "CUSTOM";

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
};

export type WorkLimitUsage = {
  usedFullDayUnits: number;
  remainingFullDayUnits: number;
  limitFullDayUnits: number;
  percentUsed: number;
  warningLevel: "ok" | "near" | "critical" | "exceeded";
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
  remainingLimitDays?: number;
  remainingLimitHours?: number | null;
  companies?: CompanyWorkSummary[];
  workLimit: {
    countryCode: string;
    studentStatus: string;
    usage: WorkLimitUsage;
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
