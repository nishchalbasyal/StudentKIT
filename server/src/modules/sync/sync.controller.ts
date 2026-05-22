import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import { getSyncSnapshot, processSyncQueueItem } from "./sync.service.js";

export const processItem = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await processSyncQueueItem(getUserId(req), req.body));
});

export const pullItems = asyncHandler(async (req: Request, res: Response) => {
  const since =
    typeof req.query.since === "string" ? req.query.since : undefined;
  return sendData(res, await getSyncSnapshot(getUserId(req), since));
});
