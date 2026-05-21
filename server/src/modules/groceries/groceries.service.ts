import type { GroceryItem, GroceryPurchase, Prisma, ShoppingListItem } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { addDays, parseDateOnly, toDateOnlyString } from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import { roundMoney } from "../work-hours/workHours.calculations.js";
import type {
  GroceryItemInput,
  GroceryPurchaseInput,
  MarkShoppingItemBoughtInput,
  ShoppingListItemInput,
  UpdateGroceryItemInput
} from "./groceries.schemas.js";

function mapGroceryItem(item: GroceryItem) {
  return item;
}

function mapPurchase(purchase: GroceryPurchase) {
  return {
    ...purchase,
    price: Number(purchase.price),
    purchaseDate: toDateOnlyString(purchase.purchaseDate),
    expectedFinishDate: purchase.expectedFinishDate ? toDateOnlyString(purchase.expectedFinishDate) : null
  };
}

function mapShoppingListItem(item: ShoppingListItem & { groceryItem?: GroceryItem }) {
  return {
    ...item,
    reminderDate: item.reminderDate ? toDateOnlyString(item.reminderDate) : null,
    groceryItem: item.groceryItem ? mapGroceryItem(item.groceryItem) : undefined
  };
}

function groceryItemInputToData(input: GroceryItemInput | UpdateGroceryItemInput) {
  const data: Prisma.GroceryItemUncheckedCreateInput | Prisma.GroceryItemUncheckedUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.category !== undefined) data.category = input.category;
  if (input.defaultQuantity !== undefined) data.defaultQuantity = input.defaultQuantity;
  if (input.estimatedDaysLasts !== undefined) data.estimatedDaysLasts = input.estimatedDaysLasts;
  if (input.isEssential !== undefined) data.isEssential = input.isEssential;

  return data;
}

export async function listGroceryItems(userId: string) {
  const items = await prisma.groceryItem.findMany({
    where: { userId },
    orderBy: [{ isEssential: "desc" }, { name: "asc" }]
  });

  return items.map(mapGroceryItem);
}

export async function createGroceryItem(userId: string, input: GroceryItemInput) {
  const item = await prisma.groceryItem.create({
    data: {
      ...groceryItemInputToData(input),
      userId
    } as Prisma.GroceryItemUncheckedCreateInput
  });

  return mapGroceryItem(item);
}

export async function updateGroceryItem(userId: string, id: string, input: UpdateGroceryItemInput) {
  await assertGroceryItemOwner(userId, id);
  const item = await prisma.groceryItem.update({
    where: { id },
    data: groceryItemInputToData(input)
  });

  return mapGroceryItem(item);
}

export async function deleteGroceryItem(userId: string, id: string) {
  await assertGroceryItemOwner(userId, id);
  await prisma.groceryItem.delete({ where: { id } });

  return { id };
}

export async function listShoppingList(userId: string) {
  const items = await prisma.shoppingListItem.findMany({
    where: { userId },
    include: { groceryItem: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return items.map(mapShoppingListItem);
}

export async function addShoppingListItem(userId: string, input: ShoppingListItemInput) {
  await assertGroceryItemOwner(userId, input.groceryItemId);
  const item = await prisma.shoppingListItem.create({
    data: {
      userId,
      groceryItemId: input.groceryItemId,
      quantity: input.quantity,
      reminderDate: input.reminderDate ? parseDateOnly(input.reminderDate) : undefined
    },
    include: { groceryItem: true }
  });

  return mapShoppingListItem(item);
}

export async function markShoppingListItemBought(
  userId: string,
  id: string,
  input: MarkShoppingItemBoughtInput
) {
  const shoppingItem = await prisma.shoppingListItem.findFirst({
    where: { id, userId },
    include: { groceryItem: true }
  });

  if (!shoppingItem) {
    throw new HttpError(404, "NOT_FOUND", "Shopping list item not found");
  }

  const updatedItem = await prisma.shoppingListItem.update({
    where: { id },
    data: {
      status: "BOUGHT",
      boughtAt: new Date()
    },
    include: { groceryItem: true }
  });

  if (input.price) {
    await recordGroceryPurchase(userId, shoppingItem.groceryItemId, {
      storeName: input.storeName,
      price: input.price,
      quantity: input.quantity ?? shoppingItem.quantity,
      purchaseDate: input.purchaseDate
    });
  }

  return mapShoppingListItem(updatedItem);
}

export async function skipShoppingListItem(userId: string, id: string) {
  const item = await prisma.shoppingListItem.findFirst({ where: { id, userId }, select: { id: true } });

  if (!item) {
    throw new HttpError(404, "NOT_FOUND", "Shopping list item not found");
  }

  const updatedItem = await prisma.shoppingListItem.update({
    where: { id },
    data: { status: "SKIPPED" },
    include: { groceryItem: true }
  });

  return mapShoppingListItem(updatedItem);
}

export async function recordGroceryPurchase(
  userId: string,
  groceryItemId: string,
  input: GroceryPurchaseInput
) {
  const groceryItem = await assertGroceryItemOwner(userId, groceryItemId);
  const purchaseDate = input.purchaseDate ? parseDateOnly(input.purchaseDate) : new Date();
  const expectedFinishDate = groceryItem.estimatedDaysLasts
    ? addDays(purchaseDate, groceryItem.estimatedDaysLasts)
    : undefined;

  const purchase = await prisma.groceryPurchase.create({
    data: {
      userId,
      groceryItemId,
      storeName: input.storeName,
      price: input.price,
      quantity: input.quantity,
      purchaseDate,
      expectedFinishDate
    }
  });

  if (expectedFinishDate) {
    await syncGroceryReminder(userId, groceryItem, expectedFinishDate);
  }

  return mapPurchase(purchase);
}

export async function getPriceHistory(userId: string, groceryItemId: string) {
  await assertGroceryItemOwner(userId, groceryItemId);
  const purchases = await prisma.groceryPurchase.findMany({
    where: { userId, groceryItemId },
    orderBy: { purchaseDate: "desc" },
    take: 20
  });

  const latestFive = purchases.slice(0, 5);
  const averagePrice =
    latestFive.length > 0
      ? roundMoney(latestFive.reduce((sum, purchase) => sum + Number(purchase.price), 0) / latestFive.length)
      : null;
  const latestPrice = purchases[0] ? Number(purchases[0].price) : null;
  const differenceFromAverage =
    latestPrice !== null && averagePrice !== null ? roundMoney(latestPrice - averagePrice) : null;

  let trend: "unknown" | "stable" | "higher" | "lower" = "unknown";

  if (differenceFromAverage !== null) {
    if (Math.abs(differenceFromAverage) < 0.1) trend = "stable";
    else trend = differenceFromAverage > 0 ? "higher" : "lower";
  }

  return {
    groceryItemId,
    latestPrice,
    averageRecentPrice: averagePrice,
    differenceFromAverage,
    trend,
    purchases: purchases.map(mapPurchase)
  };
}

async function syncGroceryReminder(userId: string, item: GroceryItem, expectedFinishDate: Date) {
  await prisma.reminder.create({
    data: {
      userId,
      title: `Grocery reminder: ${item.name}`,
      message: `${item.name} may be finished soon.`,
      type: "GROCERY",
      scheduledAt: expectedFinishDate,
      linkedEntityType: "GROCERY_ITEM",
      linkedEntityId: item.id
    }
  });
}

async function assertGroceryItemOwner(userId: string, id: string) {
  const item = await prisma.groceryItem.findFirst({ where: { id, userId } });

  if (!item) {
    throw new HttpError(404, "NOT_FOUND", "Grocery item not found");
  }

  return item;
}

