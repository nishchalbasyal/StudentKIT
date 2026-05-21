import { useMemo, useState } from "react";
import type { CompanyWorkSummary, WorkShift, WorkSummary } from "../types/work.types";
import { roundOneDecimal } from "../utils/workMath";

function buildCompaniesFromShifts(shifts: WorkShift[] = []) {
  const map = new Map<string, CompanyWorkSummary>();

  for (const shift of shifts) {
    const companyName = shift.jobName.trim() || "Unknown job";
    const current =
      map.get(companyName) ??
      {
        companyId: null,
        companyName,
        totalHours: 0,
        totalIncome: 0,
        averageHourlyIncome: 0,
        shiftCount: 0
      };

    current.totalHours += shift.calculatedHours;
    current.totalIncome += shift.calculatedIncome;
    current.shiftCount += 1;
    map.set(companyName, current);
  }

  return Array.from(map.values())
    .map((company) => ({
      ...company,
      totalHours: roundOneDecimal(company.totalHours),
      totalIncome: roundOneDecimal(company.totalIncome),
      averageHourlyIncome:
        company.totalHours > 0 ? roundOneDecimal(company.totalIncome / company.totalHours) : 0
    }))
    .sort((a, b) => b.totalIncome - a.totalIncome);
}

export function useCompanyWorkSummary(
  monthlySummary?: WorkSummary | null,
  weeklyShifts: WorkShift[] = []
) {
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [period, setPeriod] = useState<"month" | "week">("month");

  const companies = useMemo(() => {
    if (period === "week") {
      return buildCompaniesFromShifts(weeklyShifts);
    }

    return monthlySummary?.companies?.length
      ? monthlySummary.companies
      : buildCompaniesFromShifts(monthlySummary?.shifts);
  }, [monthlySummary?.companies, monthlySummary?.shifts, period, weeklyShifts]);

  const selectedCompanySummary = companies.find(
    (company) => company.companyName === selectedCompany
  );

  const visibleShifts = useMemo(() => {
    const source = period === "week" ? weeklyShifts : monthlySummary?.shifts ?? [];

    return selectedCompany === "all"
      ? source
      : source.filter((shift) => shift.jobName === selectedCompany);
  }, [monthlySummary?.shifts, period, selectedCompany, weeklyShifts]);

  const totalHours =
    selectedCompany === "all"
      ? roundOneDecimal(companies.reduce((sum, company) => sum + company.totalHours, 0))
      : selectedCompanySummary?.totalHours ?? 0;

  const totalIncome =
    selectedCompany === "all"
      ? roundOneDecimal(companies.reduce((sum, company) => sum + company.totalIncome, 0))
      : selectedCompanySummary?.totalIncome ?? 0;

  const bestCompany = companies[0] ?? null;

  return {
    period,
    setPeriod,
    selectedCompany,
    setSelectedCompany,
    companies,
    visibleShifts,
    totalHours,
    totalIncome,
    bestCompany
  };
}
