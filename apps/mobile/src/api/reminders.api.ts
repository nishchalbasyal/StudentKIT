import type { Reminder, ReminderInput } from "../types/reminder.types";
import { apiClient, unwrap } from "./apiClient";
import { reminderEngine } from "../services/reminderEngine";
import { useAuthStore } from "../store/authStore";

export async function getRemindersApi() {
  if (!useAuthStore.getState().isAuthenticated) return reminderEngine.list();
  try {
    const remote = unwrap<Reminder[]>(await apiClient.get("/reminders"));
    return remote;
  } catch {
    return reminderEngine.list();
  }
}

export async function createReminderApi(input: ReminderInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<Reminder>(await apiClient.post("/reminders", input));
    } catch {
      // Fall back to local reminder below.
    }
  }
  return reminderEngine.upsert({
    sourceType: (input.type === "EXPENSE" || input.type === "AI" ? "CUSTOM" : input.type) as never,
    sourceId: input.linkedEntityId ?? input.title,
    title: input.title,
    message: input.message,
    remindAt: input.scheduledAt,
    deliveryType: "IN_APP",
  });
}

export async function completeReminderApi(id: string) {
  const local = await reminderEngine.complete(id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<Reminder>(await apiClient.patch(`/reminders/${id}/complete`));
    } catch {
      return local as Reminder;
    }
  }
  return local as Reminder;
}

export async function deleteReminderApi(id: string) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(await apiClient.delete(`/reminders/${id}`));
    } catch {
      // Remove locally below.
    }
  }
  return reminderEngine.remove(id);
}
