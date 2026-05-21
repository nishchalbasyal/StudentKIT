import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  createBudget,
  createExpense,
  deleteBudget,
  deleteExpense,
  getCategorySpending,
  getMonthlyExpenseSummary,
  listBudgets,
  listExpenses,
  updateBudget,
  updateExpense
} from "./expenses.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listExpenses(getUserId(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createExpense(getUserId(req), req.body), 201);
});

export const monthlySummary = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getMonthlyExpenseSummary(getUserId(req), req.query as never));
});

export const categorySummary = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getCategorySpending(getUserId(req), req.query as never));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateExpense(getUserId(req), getIdParam(req), req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteExpense(getUserId(req), getIdParam(req)));
});

export const listBudgetRecords = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listBudgets(getUserId(req), req.query as never));
});

export const createBudgetRecord = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createBudget(getUserId(req), req.body), 201);
});

export const updateBudgetRecord = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateBudget(getUserId(req), getIdParam(req), req.body));
});

export const deleteBudgetRecord = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteBudget(getUserId(req), getIdParam(req)));
});

