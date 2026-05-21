import type { StudentTask, TaskInput } from "../types/task.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

function taskPayload(input: TaskInput): Omit<StudentTask, "id"> {
  return {
    title: input.title,
    description: input.description ?? null,
    type: input.type,
    dueDate: input.dueDate ?? null,
    priority: input.priority,
    status: "TODO",
    reminderAt: input.reminderAt ?? null,
    calendarSyncEnabled: input.calendarSyncEnabled ?? false,
    calendarEventId: input.calendarEventId ?? null,
    linkedClassId: input.linkedClassId ?? null,
  };
}

export async function getTasksApi() {
  if (!useAuthStore.getState().isAuthenticated) return localDb.list("tasks");
  try {
    const remote = unwrap<StudentTask[]>(await apiClient.get("/tasks"));
    await localDb.replace("tasks", await remote);
    return remote;
  } catch {
    return localDb.list("tasks");
  }
}

export async function getUpcomingTasksApi() {
  if (!useAuthStore.getState().isAuthenticated) {
    return (await localDb.list("tasks"))
      .filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED")
      .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
  }
  try {
    return unwrap<StudentTask[]>(await apiClient.get("/tasks/upcoming"));
  } catch {
    return (await localDb.list("tasks"))
      .filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED")
      .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
  }
}

export async function createTaskApi(input: TaskInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<StudentTask>(await apiClient.post("/tasks", input));
      await localDb.upsert("tasks", await remote);
      return remote;
    } catch {
      // Fall back to local create below.
    }
  }
  const local = await localDb.create("tasks", taskPayload(input));
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "task", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local;
}

export async function updateTaskApi(id: string, input: Partial<TaskInput>) {
  const current = await localDb.find("tasks", id);
  const local = current ? await localDb.update("tasks", id, { ...input }) : null;
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<StudentTask>(await apiClient.put(`/tasks/${id}`, input));
      await localDb.upsert("tasks", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "task", entityId: id, operation: "UPDATE", payload: local ?? input });
    }
  }
  return local ?? ({ id, ...taskPayload(input as TaskInput) } as StudentTask);
}

export async function completeTaskApi(id: string) {
  const local = await localDb.update("tasks", id, { status: "COMPLETED" });
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<StudentTask>(await apiClient.patch(`/tasks/${id}/complete`));
      await localDb.upsert("tasks", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "task", entityId: id, operation: "UPDATE", payload: local });
    }
  }
  return local as StudentTask;
}

export async function deleteTaskApi(id: string) {
  await localDb.remove("tasks", id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(await apiClient.delete(`/tasks/${id}`));
    } catch {
      await syncQueue.enqueue({ entityType: "task", entityId: id, operation: "DELETE", payload: { id } });
    }
  }
  return { id };
}
