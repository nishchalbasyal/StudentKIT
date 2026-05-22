import { apiClient, unwrap } from "./apiClient";

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";

export type SyncQueuePayload = {
  entityType: string;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  updatedAt?: string;
};

export type SyncSnapshot = {
  since: string;
  settings: unknown[];
  budgets: unknown[];
  reminders: unknown[];
};

export async function pushSyncApi(input: SyncQueuePayload) {
  return unwrap<Record<string, unknown>>(
    await apiClient.post("/sync/push", input),
  );
}

export async function pullSyncApi(since?: string) {
  return unwrap<SyncSnapshot>(
    await apiClient.get("/sync/pull", { params: { since } }),
  );
}
