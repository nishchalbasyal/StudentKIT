import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import { SettingsService } from "./settings.service.js";

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await SettingsService.get(getUserId(req)));
});

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(
      res,
      await SettingsService.update(getUserId(req), req.body),
    );
  },
);

export const updateNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(
      res,
      await SettingsService.updateNotifications(getUserId(req), req.body),
    );
  },
);

export const updatePreferences = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(
      res,
      await SettingsService.updatePreferences(getUserId(req), req.body),
    );
  },
);

export const updateAI = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await SettingsService.updateAI(getUserId(req), req.body),
  );
});

export const updateWork = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await SettingsService.updateWork(getUserId(req), req.body),
  );
});

export const updateModules = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(
      res,
      await SettingsService.updateModules(getUserId(req), req.body),
    );
  },
);
