import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  listReminders,
  syncReminders,
  updateReminder
} from "./reminders.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listReminders(getUserId(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createReminder(getUserId(req), req.body), 201);
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await completeReminder(getUserId(req), getIdParam(req)));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateReminder(getUserId(req), getIdParam(req), req.body));
});

export const sync = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await syncReminders(getUserId(req), req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteReminder(getUserId(req), getIdParam(req)));
});
