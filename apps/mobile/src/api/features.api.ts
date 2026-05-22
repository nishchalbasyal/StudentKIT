import { apiClient, unwrap } from "./apiClient";

export type FeatureStatus =
  | "COMING_SOON"
  | "LOGIN_REQUIRED"
  | "ONLINE_REQUIRED"
  | "AVAILABLE";

export type FeatureFlags = {
  aiAssistant: { status: FeatureStatus };
  aiQuickAdd: { status: FeatureStatus };
  cloudSync: { status: FeatureStatus };
  registeredSplitMembers: { status: FeatureStatus };
  coupons: { status: FeatureStatus };
  events: { status: FeatureStatus };
};

export async function getFeatureFlagsApi() {
  return unwrap<FeatureFlags>(await apiClient.get("/features"));
}
