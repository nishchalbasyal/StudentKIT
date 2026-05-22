import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import {
  getAIStatus,
  generateExpenseAdvice,
  generateWeeklySummary,
  getLatestAIInsights,
  requestAIResponse,
  suggestGrocerySavings,
  suggestStudyPlan,
  suggestWorkLimitWarning,
} from "./ai.service.js";

export const latestInsights = asyncHandler(
  async (req: Request, res: Response) => {
    const rawLimit = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit;
    const limit = rawLimit ? Number(rawLimit) : 3;

    return sendData(
      res,
      await getLatestAIInsights(
        getUserId(req),
        Number.isFinite(limit) ? limit : 3,
      ),
    );
  },
);

export const status = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getAIStatus(getUserId(req)));
});

export const requestAI = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await requestAIResponse(getUserId(req), req.body), 503);
});

export const expenseAdvice = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await generateExpenseAdvice(getUserId(req)));
  },
);

export const weeklySummary = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await generateWeeklySummary(getUserId(req)));
  },
);

export const groceryAdvice = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await suggestGrocerySavings(getUserId(req)));
  },
);

export const studyPlan = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await suggestStudyPlan(getUserId(req), req.body));
});

export const workLimitWarning = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await suggestWorkLimitWarning(getUserId(req)));
  },
);
