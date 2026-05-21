import { z } from "zod";

export const grocerySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().max(80).optional(),
  defaultQuantity: z.string().trim().max(80).optional(),
  estimatedDaysLasts: z.coerce.number().int().min(1).max(365).optional(),
  isEssential: z.coerce.boolean().default(false)
});

export const shoppingListSchema = z.object({
  groceryItemId: z.string().min(1, "Choose an item"),
  quantity: z.string().trim().min(1, "Quantity is required"),
  reminderDate: z.string().date().optional()
});

export const boughtSchema = z.object({
  storeName: z.string().trim().max(120).optional(),
  price: z.coerce.number().positive("Price must be positive"),
  quantity: z.string().trim().min(1, "Quantity is required"),
  purchaseDate: z.string().date("Use YYYY-MM-DD")
});

export type GroceryFormValues = z.infer<typeof grocerySchema>;
export type ShoppingListFormValues = z.infer<typeof shoppingListSchema>;
export type BoughtFormValues = z.infer<typeof boughtSchema>;

