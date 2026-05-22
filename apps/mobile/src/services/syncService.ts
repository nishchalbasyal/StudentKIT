import { apiClient } from "../api/apiClient";
import { localDb } from "../storage/localDb";
import { getLocalSettings, saveLocalSettings } from "../storage/settingsStorage";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

export const syncService = {
  async hasLocalData() {
    const [
      tasks,
      reminders,
      workEntries,
      expenses,
      groceries,
      cleaningRoutines,
      splitGroups,
      splitSettlements,
    ] = await Promise.all([
      localDb.list("tasks"),
      localDb.list("reminders"),
      localDb.list("workEntries"),
      localDb.list("expenses"),
      localDb.list("groceries"),
      localDb.list("cleaningRoutines"),
      localDb.list("splitGroups"),
      localDb.list("splitSettlements"),
    ]);

    return [
      tasks,
      reminders,
      workEntries,
      expenses,
      groceries,
      cleaningRoutines,
      splitGroups,
      splitSettlements,
    ].some((items) => items.length > 0);
  },

  async syncSettings() {
    if (!useAuthStore.getState().isAuthenticated) return null;
    const settings = await getLocalSettings();
    try {
      const response = await apiClient.put("/settings", {
        ...settings.notifications,
        ...settings.preferences,
        ...settings.ai,
        ...settings.work,
        userEnabledModules: settings.userEnabledModules,
      });
      await saveLocalSettings(response.data.data);
      return response.data.data;
    } catch (error) {
      await syncQueue.enqueue({
        entityType: "settings",
        entityId: settings.id,
        operation: "UPDATE",
        payload: settings,
      });
      return null;
    }
  },

  async syncLocalDataAfterLogin() {
    if (!useAuthStore.getState().isAuthenticated) {
      return { processed: 0, failed: 0 };
    }

    await this.syncSettings();
    const collections = [
      ["task", "tasks"],
      ["reminder", "reminders"],
      ["workEntry", "workEntries"],
      ["expense", "expenses"],
      ["budget", "budgets"],
      ["grocery", "groceries"],
      ["cleaning", "cleaningRoutines"],
      ["splitGroup", "splitGroups"],
      ["splitMember", "splitMembers"],
      ["splitExpense", "splitExpenses"],
      ["splitSettlement", "splitSettlements"],
    ] as const;

    for (const [entityType, collection] of collections) {
      const items = await localDb.list(collection);
      for (const item of items) {
        await syncQueue.enqueue({
          entityType,
          entityId: item.id,
          operation: "CREATE",
          payload: item,
        });
      }
    }

    return syncQueue.processWithBackend();
  },
};
