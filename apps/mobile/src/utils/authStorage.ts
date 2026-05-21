import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type WebStorage = {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

const memoryStorage = new Map<string, string>();

function getWebStorage() {
  if (Platform.OS !== "web") {
    return null;
  }

  try {
    return (globalThis as unknown as { localStorage?: WebStorage }).localStorage ?? null;
  } catch {
    return null;
  }
}

async function canUseSecureStore() {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getAuthItem(key: string) {
  const webStorage = getWebStorage();

  try {
    if (webStorage) {
      return webStorage.getItem(key);
    }

    if (await canUseSecureStore()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {
    return memoryStorage.get(key) ?? null;
  }

  return memoryStorage.get(key) ?? null;
}

export async function setAuthItem(key: string, value: string) {
  const webStorage = getWebStorage();

  try {
    if (webStorage) {
      webStorage.setItem(key, value);
      memoryStorage.set(key, value);
      return;
    }

    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(key, value);
      memoryStorage.set(key, value);
      return;
    }
  } catch {
    // Keep the current session usable even when persistent storage is unavailable.
  }

  memoryStorage.set(key, value);
}

export async function deleteAuthItem(key: string) {
  const webStorage = getWebStorage();

  try {
    if (webStorage) {
      webStorage.removeItem(key);
      memoryStorage.delete(key);
      return;
    }

    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(key);
      memoryStorage.delete(key);
      return;
    }
  } catch {
    // Clearing in-memory state is still enough to log the user out for this run.
  }

  memoryStorage.delete(key);
}
