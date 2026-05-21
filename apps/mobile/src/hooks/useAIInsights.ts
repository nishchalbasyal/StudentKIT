import { useQuery } from "@tanstack/react-query";
import { getLatestAIInsightsApi } from "../api/ai.api";

export function useAIInsights(limit = 3) {
  return useQuery({
    queryKey: ["aiInsights", "latest", limit],
    queryFn: () => getLatestAIInsightsApi(limit),
    staleTime: 1000 * 60 * 30
  });
}
