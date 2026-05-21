import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../api/apiClient";
import { useAuthStore } from "../store/authStore";

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";

export type SyncQueueItem = {
  id: string;
  entityType: string;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  status: SyncStatus;
  retryCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

const syncQueueKey = "student-kit.syncQueue";

function createQueueId() {
  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readQueue(): Promise<SyncQueueItem[]> {
  const raw = await AsyncStorage.getItem(syncQueueKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SyncQueueItem[];
  } catch {
    await AsyncStorage.removeItem(syncQueueKey);
    return [];
  }
}

async function writeQueue(items: SyncQueueItem[]) {
  await AsyncStorage.setItem(syncQueueKey, JSON.stringify(items));
}

export const syncQueue = {
  list: readQueue,

  async enqueue(input: Omit<SyncQueueItem, "id" | "status" | "retryCount" | "createdAt" | "updatedAt">) {
    const timestamp = new Date().toISOString();
    const queue = await readQueue();
    const existingIndex = queue.findIndex(
      (item) =>
        item.entityType === input.entityType &&
        item.entityId === input.entityId &&
        item.status === "PENDING",
    );
    const existing = existingIndex >= 0 ? queue[existingIndex] : undefined;
    const item: SyncQueueItem = {
      ...input,
      id: existing?.id ?? createQueueId(),
      status: "PENDING",
      retryCount: existing?.retryCount ?? 0,
      lastError: null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    const next =
      existingIndex >= 0
        ? [...queue.slice(0, existingIndex), item, ...queue.slice(existingIndex + 1)]
        : [item, ...queue];

    await writeQueue(next);
    return item;
  },

  async markSynced(id: string) {
    const queue = await readQueue();
    await writeQueue(
      queue.map((item) =>
        item.id === id
          ? { ...item, status: "SYNCED", updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  },

  async markFailed(id: string, error: unknown) {
    const queue = await readQueue();
    const message = error instanceof Error ? error.message : "Sync failed";
    await writeQueue(
      queue.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "FAILED",
              retryCount: item.retryCount + 1,
              lastError: message,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  },

  async pending() {
    return (await readQueue()).filter((item) => item.status === "PENDING" || item.status === "FAILED");
  },

  async clearSynced() {
    await writeQueue((await readQueue()).filter((item) => item.status !== "SYNCED"));
  },

  async processWithBackend() {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return { processed: 0, failed: 0 };

    const pending = await this.pending();
    let processed = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        await apiClient.post("/sync", {
          entityType: item.entityType,
          entityId: item.entityId,
          operation: item.operation,
          payload: item.payload,
          updatedAt: item.updatedAt,
        });
        await this.markSynced(item.id);
        processed += 1;
      } catch (error) {
        await this.markFailed(item.id, error);
        failed += 1;
      }
    }

    await this.clearSynced();
    return { processed, failed };
  },
};
