import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getFeatureFlagsApi,
  type FeatureFlags,
  type FeatureStatus,
} from "../api/features.api";

const featureMessages: Record<FeatureStatus, string> = {
  COMING_SOON: "AI features are coming soon.",
  LOGIN_REQUIRED: "Login to sync this across devices.",
  ONLINE_REQUIRED: "Connect to internet to refresh this content.",
  AVAILABLE: "",
};

export function useFeatureAccess() {
  const query = useQuery({
    queryKey: ["features"],
    queryFn: getFeatureFlagsApi,
  });

  const features = (query.data ?? {}) as FeatureFlags;

  const access = useMemo(
    () => ({
      getStatus(feature: keyof FeatureFlags) {
        return features[feature]?.status ?? "AVAILABLE";
      },
      canUse(feature: keyof FeatureFlags) {
        return (features[feature]?.status ?? "AVAILABLE") === "AVAILABLE";
      },
      getMessage(feature: keyof FeatureFlags) {
        const status = features[feature]?.status ?? "AVAILABLE";
        return featureMessages[status];
      },
    }),
    [features],
  );

  return {
    features,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    ...access,
  };
}
