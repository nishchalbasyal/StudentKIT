import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getFeatureFlags } from "./features.service.js";

export const getFeatures = asyncHandler(
  async (_req: Request, res: Response) => {
    return sendData(res, await getFeatureFlags());
  },
);
