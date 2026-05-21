import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import { getDashboard } from "./dashboard.service.js";

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getDashboard(getUserId(req)));
});

