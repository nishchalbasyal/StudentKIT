export const DEFAULT_GERMANY_WORK_LIMIT_POLICY = {
  countryCode: "DE",
  yearlyFullDayLimit: 140,
  yearlyHalfDayLimit: 280,
  halfDayMaxHours: 4,
  sourceUrls: [
    "https://www.make-it-in-germany.com/en/study-vocational-training/studies-in-germany/work",
    "https://www.b-tu.de/en/international/international-students/help-advice-on-all-aspects-of-studying/work-while-studying"
  ]
} as const;

export const WORK_LIMIT_WARNING_THRESHOLDS = {
  nearLimitPercent: 80,
  criticalLimitPercent: 95
} as const;

