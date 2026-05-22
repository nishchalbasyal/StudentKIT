export async function getFeatureFlags() {
  return {
    aiAssistant: { status: "COMING_SOON" },
    aiQuickAdd: { status: "COMING_SOON" },
    cloudSync: { status: "LOGIN_REQUIRED" },
    registeredSplitMembers: { status: "LOGIN_REQUIRED" },
    coupons: { status: "ONLINE_REQUIRED" },
    events: { status: "ONLINE_REQUIRED" },
  };
}
