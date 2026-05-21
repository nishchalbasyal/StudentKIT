import type {
  GroceryInput,
  GroceryItem,
  GroceryPurchase,
  PriceHistory,
  ShoppingListItem
} from "../types/grocery.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

export async function getGroceryItemsApi() {
  if (!useAuthStore.getState().isAuthenticated) return localDb.list("groceries");
  try {
    const remote = unwrap<GroceryItem[]>(await apiClient.get("/groceries/items"));
    await localDb.replace("groceries", await remote);
    return remote;
  } catch {
    return localDb.list("groceries");
  }
}

export async function createGroceryItemApi(input: GroceryInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<GroceryItem>(await apiClient.post("/groceries/items", input));
      await localDb.upsert("groceries", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("groceries", input);
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "grocery", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local;
}

export async function updateGroceryItemApi(id: string, input: Partial<GroceryInput>) {
  const local = await localDb.update("groceries", id, input);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<GroceryItem>(await apiClient.put(`/groceries/items/${id}`, input));
      await localDb.upsert("groceries", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "grocery", entityId: id, operation: "UPDATE", payload: local ?? input });
    }
  }
  return local as GroceryItem;
}

export async function deleteGroceryItemApi(id: string) {
  await localDb.remove("groceries", id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(await apiClient.delete(`/groceries/items/${id}`));
    } catch {
      await syncQueue.enqueue({ entityType: "grocery", entityId: id, operation: "DELETE", payload: { id } });
    }
  }
  return { id };
}

export async function getShoppingListApi() {
  if (!useAuthStore.getState().isAuthenticated) return localDb.list("shoppingList");
  try {
    const remote = unwrap<ShoppingListItem[]>(await apiClient.get("/groceries/shopping-list"));
    await localDb.replace("shoppingList", await remote);
    return remote;
  } catch {
    return localDb.list("shoppingList");
  }
}

export async function addShoppingListItemApi(input: {
  groceryItemId: string;
  quantity: string;
  reminderDate?: string;
}) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<ShoppingListItem>(await apiClient.post("/groceries/shopping-list", input));
      await localDb.upsert("shoppingList", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("shoppingList", { ...input, status: "PENDING" });
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "shoppingList", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local;
}

export async function markShoppingListItemBoughtApi(
  id: string,
  input: { storeName?: string; price?: number; quantity?: string; purchaseDate?: string }
) {
  const local = await localDb.update("shoppingList", id, {
    status: "BOUGHT",
    boughtAt: input.purchaseDate ?? new Date().toISOString(),
  });
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<ShoppingListItem>(await apiClient.patch(`/groceries/shopping-list/${id}/bought`, input));
      await localDb.upsert("shoppingList", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "shoppingList", entityId: id, operation: "UPDATE", payload: local ?? input });
    }
  }
  return local as ShoppingListItem;
}

export async function getPriceHistoryApi(groceryItemId: string) {
  return unwrap<PriceHistory>(await apiClient.get(`/groceries/items/${groceryItemId}/price-history`));
}

export async function createGroceryPurchaseApi(
  groceryItemId: string,
  input: { storeName?: string; price: number; quantity: string; purchaseDate?: string }
) {
  return unwrap<GroceryPurchase>(await apiClient.post(`/groceries/items/${groceryItemId}/purchases`, input));
}
