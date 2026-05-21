import type { CleaningTask, CleaningTaskInput } from "../types/cleaning.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

function nextReminderAt(intervalDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString();
}

export async function getCleaningTasksApi() {
  if (!useAuthStore.getState().isAuthenticated) return localDb.list("cleaningRoutines");
  try {
    const remote = unwrap<CleaningTask[]>(await apiClient.get("/cleaning"));
    await localDb.replace("cleaningRoutines", await remote);
    return remote;
  } catch {
    return localDb.list("cleaningRoutines");
  }
}

export async function createCleaningTaskApi(input: CleaningTaskInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<CleaningTask>(await apiClient.post("/cleaning", input));
      await localDb.upsert("cleaningRoutines", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("cleaningRoutines", {
    ...input,
    lastCompletedAt: null,
    nextReminderAt: nextReminderAt(input.intervalDays),
    daysSinceLastDone: null,
  });
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "cleaning", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local;
}

export async function updateCleaningTaskApi(id: string, input: Partial<CleaningTaskInput>) {
  const local = await localDb.update("cleaningRoutines", id, {
    ...input,
    nextReminderAt: input.intervalDays ? nextReminderAt(input.intervalDays) : undefined,
  });
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<CleaningTask>(await apiClient.put(`/cleaning/${id}`, input));
      await localDb.upsert("cleaningRoutines", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "cleaning", entityId: id, operation: "UPDATE", payload: local ?? input });
    }
  }
  return local as CleaningTask;
}

export async function completeCleaningTaskApi(id: string) {
  const current = (await localDb.find("cleaningRoutines", id)) as CleaningTask | null;
  const local = await localDb.update("cleaningRoutines", id, {
    lastCompletedAt: new Date().toISOString(),
    nextReminderAt: nextReminderAt(current?.intervalDays ?? 7),
    daysSinceLastDone: 0,
  });
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<CleaningTask>(await apiClient.patch(`/cleaning/${id}/complete`));
      await localDb.upsert("cleaningRoutines", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "cleaning", entityId: id, operation: "UPDATE", payload: local });
    }
  }
  return local as CleaningTask;
}

export async function deleteCleaningTaskApi(id: string) {
  await localDb.remove("cleaningRoutines", id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(await apiClient.delete(`/cleaning/${id}`));
    } catch {
      await syncQueue.enqueue({ entityType: "cleaning", entityId: id, operation: "DELETE", payload: { id } });
    }
  }
  return { id };
}
