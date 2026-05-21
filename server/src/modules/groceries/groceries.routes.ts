import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import {
  addShopping,
  boughtShopping,
  createItem,
  createPurchase,
  deleteItem,
  listItems,
  listShopping,
  priceHistory,
  skippedShopping,
  updateItem
} from "./groceries.controller.js";
import {
  groceryItemSchema,
  groceryPurchaseSchema,
  markShoppingItemBoughtSchema,
  shoppingListItemSchema,
  updateGroceryItemSchema
} from "./groceries.schemas.js";

export const groceriesRoutes = Router();

groceriesRoutes.use(authenticate);
groceriesRoutes.get("/items", listItems);
groceriesRoutes.post("/items", validateBody(groceryItemSchema), createItem);
groceriesRoutes.put("/items/:id", validateBody(updateGroceryItemSchema), updateItem);
groceriesRoutes.delete("/items/:id", deleteItem);
groceriesRoutes.get("/shopping-list", listShopping);
groceriesRoutes.post("/shopping-list", validateBody(shoppingListItemSchema), addShopping);
groceriesRoutes.patch("/shopping-list/:id/bought", validateBody(markShoppingItemBoughtSchema), boughtShopping);
groceriesRoutes.patch("/shopping-list/:id/skipped", skippedShopping);
groceriesRoutes.get("/items/:id/price-history", priceHistory);
groceriesRoutes.post("/items/:id/purchases", validateBody(groceryPurchaseSchema), createPurchase);

