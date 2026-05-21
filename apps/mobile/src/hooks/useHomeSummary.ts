import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardApi } from "../api/dashboard.api";
import { getUpcomingTasksApi } from "../api/tasks.api";
import { buildStudentFeed } from "../utils/feedEngine";
import { buildTodayFocusItems } from "../utils/homePriorityEngine";
import { buildHomeInsights } from "../utils/insightFormatter";
import { useAIInsights } from "./useAIInsights";
import { useWorkHours } from "./useWorkHours";

export function useHomeSummary(currency?: string) {
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardApi,
    staleTime: 1000 * 60
  });
  const upcomingTasks = useQuery({
    queryKey: ["tasks", "upcoming"],
    queryFn: getUpcomingTasksApi,
    staleTime: 1000 * 60
  });
  const { monthlySummary, weeklySummary, workShifts } = useWorkHours();
  const aiInsights = useAIInsights(3);

  const focusItems = useMemo(
    () =>
      dashboard.data
        ? buildTodayFocusItems(dashboard.data, monthlySummary.data)
        : [],
    [dashboard.data, monthlySummary.data]
  );

  const insights = useMemo(
    () =>
      dashboard.data
        ? buildHomeInsights(
            dashboard.data,
            monthlySummary.data,
            aiInsights.data ?? [],
            currency
          )
        : [],
    [aiInsights.data, currency, dashboard.data, monthlySummary.data]
  );

  const feed = useMemo(
    () =>
      dashboard.data
        ? buildStudentFeed(dashboard.data, monthlySummary.data, aiInsights.data ?? [])
        : [],
    [aiInsights.data, dashboard.data, monthlySummary.data]
  );

  return {
    dashboard,
    upcomingTasks,
    monthlySummary,
    weeklySummary,
    workShifts,
    aiInsights,
    focusItems,
    insights,
    feed,
    isLoading:
      dashboard.isLoading ||
      monthlySummary.isLoading ||
      weeklySummary.isLoading ||
      workShifts.isLoading,
    isError:
      dashboard.isError ||
      monthlySummary.isError ||
      weeklySummary.isError ||
      workShifts.isError
  };
}
