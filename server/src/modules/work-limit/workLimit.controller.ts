import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import {
  dismissUnlimitedBanner,
  getCurrentWorkLimitSummary,
  getWorkLimitSettings,
  resetWorkLimitSettings,
  saveWorkLimitSettings,
} from "./workLimit.service.js";

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getWorkLimitSettings(getUserId(req)));
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getCurrentWorkLimitSummary(getUserId(req)));
});

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await saveWorkLimitSettings(getUserId(req), req.body));
  },
);

export const resetSettings = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await resetWorkLimitSettings(getUserId(req)));
  },
);

export const dismissBanner = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(res, await dismissUnlimitedBanner(getUserId(req)));
  },
);
