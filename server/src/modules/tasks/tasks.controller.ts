import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  completeTask,
  createTask,
  deleteTask,
  getUpcomingTasks,
  listTasks,
  updateTask
} from "./tasks.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listTasks(getUserId(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createTask(getUserId(req), req.body), 201);
});

export const upcoming = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getUpcomingTasks(getUserId(req)));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateTask(getUserId(req), getIdParam(req), req.body));
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await completeTask(getUserId(req), getIdParam(req)));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteTask(getUserId(req), getIdParam(req)));
});

