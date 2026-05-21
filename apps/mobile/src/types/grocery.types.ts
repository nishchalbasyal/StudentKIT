export type GroceryItem = {
  id: string;
  name: string;
  category?: string | null;
  defaultQuantity?: string | null;
  estimatedDaysLasts?: number | null;
  isEssential: boolean;
};

export type GroceryInput = {
  name: string;
  category?: string;
  defaultQuantity?: string;
  estimatedDaysLasts?: number;
  isEssential: boolean;
};

export type ShoppingListItem = {
  id: string;
  groceryItemId: string;
  quantity: string;
  status: "PENDING" | "BOUGHT" | "SKIPPED";
  reminderDate?: string | null;
  boughtAt?: string | null;
  groceryItem?: GroceryItem;
};

export type GroceryPurchase = {
  id: string;
  groceryItemId: string;
  storeName?: string | null;
  price: number;
  quantity: string;
  purchaseDate: string;
  expectedFinishDate?: string | null;
};

export type PriceHistory = {
  groceryItemId: string;
  latestPrice: number | null;
  averageRecentPrice: number | null;
  differenceFromAverage: number | null;
  trend: "unknown" | "stable" | "higher" | "lower";
  purchases: GroceryPurchase[];
};

