import { apiClient } from "../api/apiClient";
import { localDb } from "../storage/localDb";
import { getLocalSettings, saveLocalSettings } from "../storage/settingsStorage";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

export const syncService = {
  async hasLocalData() {
    const [workEntries] = await Promise.all([localDb.list("workEntries")]);
    return workEntries.length > 0;
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
    const workEntries = await localDb.list("workEntries");
    for (const item of workEntries) {
      await syncQueue.enqueue({
        entityType: "workEntry",
        entityId: item.id,
        operation: item.syncedAt ? "UPDATE" : "CREATE",
        payload: item,
      });
    }

    return syncQueue.processWithBackend();
  },
};
