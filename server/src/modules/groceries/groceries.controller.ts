import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  addShoppingListItem,
  createGroceryItem,
  deleteGroceryItem,
  getPriceHistory,
  listGroceryItems,
  listShoppingList,
  markShoppingListItemBought,
  recordGroceryPurchase,
  skipShoppingListItem,
  updateGroceryItem
} from "./groceries.service.js";

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listGroceryItems(getUserId(req)));
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createGroceryItem(getUserId(req), req.body), 201);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateGroceryItem(getUserId(req), getIdParam(req), req.body));
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteGroceryItem(getUserId(req), getIdParam(req)));
});

export const listShopping = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listShoppingList(getUserId(req)));
});

export const addShopping = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await addShoppingListItem(getUserId(req), req.body), 201);
});

export const boughtShopping = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await markShoppingListItemBought(getUserId(req), getIdParam(req), req.body));
});

export const skippedShopping = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await skipShoppingListItem(getUserId(req), getIdParam(req)));
});

export const priceHistory = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getPriceHistory(getUserId(req), getIdParam(req)));
});

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await recordGroceryPurchase(getUserId(req), getIdParam(req), req.body), 201);
});

