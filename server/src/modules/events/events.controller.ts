import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam } from "../../utils/request.js";
import { getEvent, listEvents } from "./events.service.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  return sendData(res, await listEvents());
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getEvent(getIdParam(req)));
});
