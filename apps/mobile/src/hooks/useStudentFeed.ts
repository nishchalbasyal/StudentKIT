import { useMemo } from "react";
import type { Dashboard, AIInsight } from "../types/dashboard.types";
import type { WorkSummary } from "../types/work.types";
import { buildStudentFeed } from "../utils/feedEngine";

export function useStudentFeed(
  dashboard?: Dashboard | null,
  workSummary?: WorkSummary | null,
  aiInsights: AIInsight[] = []
) {
  return useMemo(
    () => (dashboard ? buildStudentFeed(dashboard, workSummary, aiInsights) : []),
    [aiInsights, dashboard, workSummary]
  );
}
