import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  completeCleaningTask,
  createCleaningTask,
  deleteCleaningTask,
  listCleaningTasks,
  updateCleaningTask
} from "./cleaning.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listCleaningTasks(getUserId(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createCleaningTask(getUserId(req), req.body), 201);
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await completeCleaningTask(getUserId(req), getIdParam(req)));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateCleaningTask(getUserId(req), getIdParam(req), req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteCleaningTask(getUserId(req), getIdParam(req)));
});

