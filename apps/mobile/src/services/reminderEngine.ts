import { scheduleReminderNotification } from "../utils/notifications";
import { localDb, createLocalId } from "../storage/localDb";
import { getLocalSettings } from "../storage/settingsStorage";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";
import type { CleaningTask } from "../types/cleaning.types";
import type { GroceryItem, ShoppingListItem } from "../types/grocery.types";
import type { Reminder, ReminderDeliveryType, ReminderSourceType } from "../types/reminder.types";
import type { StudentTask } from "../types/task.types";
import type { WorkShift } from "../types/work.types";

function nowIso() {
  return new Date().toISOString();
}

function sourceToLegacyType(sourceType: ReminderSourceType): Reminder["type"] {
  if (sourceType === "SPLIT") return "CUSTOM";
  return sourceType;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function makeReminder(input: {
  sourceType: ReminderSourceType;
  sourceId: string;
  title: string;
  message?: string | null;
  remindAt: string;
  repeatRule?: string | null;
  deliveryType?: ReminderDeliveryType;
  isEnabled?: boolean;
}) {
  const timestamp = nowIso();
  const id = createLocalId("reminder");
  const userId = useAuthStore.getState().user?.id ?? null;

  return {
    id,
    localId: id,
    userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    title: input.title,
    message: input.message ?? null,
    remindAt: input.remindAt,
    repeatRule: input.repeatRule ?? null,
    isEnabled: input.isEnabled ?? true,
    isCompleted: false,
    deliveryType: input.deliveryType ?? "IN_APP",
    createdAt: timestamp,
    updatedAt: timestamp,
    syncedAt: null,
    type: sourceToLegacyType(input.sourceType),
    scheduledAt: input.remindAt,
    linkedEntityType: input.sourceType,
    linkedEntityId: input.sourceId,
    completedAt: null,
  } satisfies Reminder;
}

async function persistReminder(reminder: Reminder) {
  const settings = await getLocalSettings();
  const notificationsEnabled = settings.notifications.pushNotifications;
  const reminderCategoryEnabled =
    reminder.sourceType === "TASK"
      ? settings.notifications.reminderCategories.tasks
      : reminder.sourceType === "GROCERY"
        ? settings.notifications.reminderCategories.groceries
        : reminder.sourceType === "CLEANING"
          ? settings.notifications.reminderCategories.cleaning
          : reminder.sourceType === "WORK"
            ? settings.notifications.reminderCategories.work
            : reminder.sourceType === "SPLIT"
              ? settings.notifications.reminderCategories.splitSettlements
              : true;

  const deliveryType =
    notificationsEnabled && reminderCategoryEnabled
      ? reminder.deliveryType
      : "IN_APP";
  const saved = await localDb.upsert("reminders", { ...reminder, deliveryType });

  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({
      entityType: "reminder",
      entityId: saved.id,
      operation: "CREATE",
      payload: saved,
    });
  }

  if (deliveryType === "PUSH") {
    await scheduleReminderNotification(saved);
  }

  return saved;
}

export const reminderEngine = {
  async list() {
    const reminders = await localDb.list("reminders");
    return reminders.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return new Date(a.remindAt ?? a.scheduledAt).getTime() - new Date(b.remindAt ?? b.scheduledAt).getTime();
    });
  },

  async upsert(input: Parameters<typeof makeReminder>[0]) {
    return persistReminder(makeReminder(input));
  },

  async createForTask(task: StudentTask) {
    const remindAt = task.reminderAt ?? task.dueDate;
    if (!remindAt) return null;

    return persistReminder(
      makeReminder({
        sourceType: "TASK",
        sourceId: task.id,
        title: task.title,
        message: task.dueDate ? "Task due soon" : "Task reminder",
        remindAt,
        deliveryType: "PUSH",
      }),
    );
  },

  async createForGrocery(item: GroceryItem, shoppingItem?: ShoppingListItem) {
    const days = item.estimatedDaysLasts ?? 7;
    const remindAt = shoppingItem?.reminderDate
      ? new Date(shoppingItem.reminderDate).toISOString()
      : addMinutes(new Date(), days * 24 * 60).toISOString();

    return persistReminder(
      makeReminder({
        sourceType: "GROCERY",
        sourceId: shoppingItem?.id ?? item.id,
        title: `${item.name} may be running low`,
        message: item.defaultQuantity ? `Usual quantity: ${item.defaultQuantity}` : "Grocery reminder",
        remindAt,
        deliveryType: "IN_APP",
      }),
    );
  },

  async createForCleaning(routine: CleaningTask) {
    const remindAt =
      routine.nextReminderAt ??
      addMinutes(new Date(), routine.intervalDays * 24 * 60).toISOString();

    return persistReminder(
      makeReminder({
        sourceType: "CLEANING",
        sourceId: routine.id,
        title: routine.title,
        message: "Cleaning routine due",
        remindAt,
        repeatRule: `P${routine.intervalDays}D`,
        deliveryType: "PUSH",
      }),
    );
  },

  async createForWork(shift: WorkShift, minutesBefore = 60) {
    const shiftStart = new Date(`${shift.date}T${shift.startTime}:00`);
    if (Number.isNaN(shiftStart.getTime())) return null;
    const remindAt = addMinutes(shiftStart, -minutesBefore).toISOString();

    return persistReminder(
      makeReminder({
        sourceType: "WORK",
        sourceId: shift.id,
        title: `Upcoming shift: ${shift.jobName}`,
        message: `${shift.startTime} - ${shift.endTime}`,
        remindAt,
        deliveryType: "IN_APP",
      }),
    );
  },

  async createForSplit(sourceId: string, title = "Split settlement reminder") {
    return persistReminder(
      makeReminder({
        sourceType: "SPLIT",
        sourceId,
        title,
        message: "Settle or review this split balance",
        remindAt: addMinutes(new Date(), 24 * 60).toISOString(),
        deliveryType: "IN_APP",
      }),
    );
  },

  async complete(id: string) {
    const updated = await localDb.update("reminders", id, {
      isCompleted: true,
      completedAt: nowIso(),
    });
    if (updated && useAuthStore.getState().isAuthenticated) {
      await syncQueue.enqueue({
        entityType: "reminder",
        entityId: id,
        operation: "UPDATE",
        payload: updated,
      });
    }
    return updated;
  },

  async remove(id: string) {
    await localDb.remove("reminders", id);
    if (useAuthStore.getState().isAuthenticated) {
      await syncQueue.enqueue({
        entityType: "reminder",
        entityId: id,
        operation: "DELETE",
        payload: { id },
      });
    }
    return { id };
  },
};
