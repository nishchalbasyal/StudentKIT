import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addShoppingListItemApi,
  createGroceryItemApi,
  getGroceryItemsApi,
  getShoppingListApi,
  markShoppingListItemBoughtApi,
  updateGroceryItemApi
} from "../api/groceries.api";
import type { GroceryInput } from "../types/grocery.types";
import { reminderEngine } from "../services/reminderEngine";

export function useGroceries() {
  const queryClient = useQueryClient();
  const groceries = useQuery({ queryKey: ["groceries"], queryFn: getGroceryItemsApi });
  const shoppingList = useQuery({ queryKey: ["shoppingList"], queryFn: getShoppingListApi });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["groceries"] });
    await queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createItemMutation = useMutation({
    mutationFn: (input: GroceryInput) => createGroceryItemApi(input),
    onSuccess: async (item) => {
      if (item.estimatedDaysLasts) await reminderEngine.createForGrocery(item);
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });
  const updateItemMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GroceryInput> }) =>
      updateGroceryItemApi(id, input),
    onSuccess: invalidate,
  });
  const addShoppingMutation = useMutation({
    mutationFn: (input: { groceryItemId: string; quantity: string; reminderDate?: string }) =>
      addShoppingListItemApi(input),
    onSuccess: async (shoppingItem) => {
      const grocery = (groceries.data ?? []).find((item) => item.id === shoppingItem.groceryItemId);
      if (grocery && (shoppingItem.reminderDate || grocery.estimatedDaysLasts)) {
        await reminderEngine.createForGrocery(grocery, shoppingItem);
      }
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });
  const boughtMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { storeName?: string; price?: number; quantity?: string; purchaseDate?: string } }) =>
      markShoppingListItemBoughtApi(id, input),
    onSuccess: invalidate
  });

  return {
    groceries,
    shoppingList,
    createGroceryItem: createItemMutation.mutateAsync,
    updateGroceryItem: updateItemMutation.mutateAsync,
    addShoppingListItem: addShoppingMutation.mutateAsync,
    markShoppingListItemBought: boughtMutation.mutateAsync,
    isSaving: createItemMutation.isPending || updateItemMutation.isPending || addShoppingMutation.isPending || boughtMutation.isPending
  };
}
