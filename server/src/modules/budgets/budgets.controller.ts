import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import { BudgetsService } from "./budgets.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await BudgetsService.getAllBudgets(getUserId(req)));
});

export const current = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await BudgetsService.getCurrentBudgets(getUserId(req)));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await BudgetsService.getBudget(getIdParam(req), getUserId(req)),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await BudgetsService.createBudget(getUserId(req), req.body),
    201,
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await BudgetsService.updateBudget(
      getIdParam(req),
      getUserId(req),
      req.body,
    ),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await BudgetsService.deleteBudget(getIdParam(req), getUserId(req)),
  );
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const { year, month } = req.query as unknown as { year: number; month?: number };

  return sendData(
    res,
    await BudgetsService.getBudgetSummary(
      getUserId(req),
      year,
      month,
    ),
  );
});
