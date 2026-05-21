import { z } from "zod";

export const groceryItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().max(80).optional(),
  defaultQuantity: z.string().trim().max(80).optional(),
  estimatedDaysLasts: z.coerce.number().int().min(1).max(365).optional(),
  isEssential: z.coerce.boolean().default(false)
});

export const updateGroceryItemSchema = groceryItemSchema.partial();

export const shoppingListItemSchema = z.object({
  groceryItemId: z.string().min(1),
  quantity: z.string().trim().min(1).max(80),
  reminderDate: z.string().date().optional()
});

export const groceryPurchaseSchema = z.object({
  storeName: z.string().trim().max(120).optional(),
  price: z.coerce.number().positive().max(100000),
  quantity: z.string().trim().min(1).max(80),
  purchaseDate: z.string().date().optional()
});

export const markShoppingItemBoughtSchema = groceryPurchaseSchema.partial().extend({
  price: z.coerce.number().positive().max(100000).optional()
});

export type GroceryItemInput = z.infer<typeof groceryItemSchema>;
export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemSchema>;
export type ShoppingListItemInput = z.infer<typeof shoppingListItemSchema>;
export type GroceryPurchaseInput = z.infer<typeof groceryPurchaseSchema>;
export type MarkShoppingItemBoughtInput = z.infer<typeof markShoppingItemBoughtSchema>;

