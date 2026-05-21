import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  createClass,
  deleteClass,
  getWeeklyClasses,
  listClasses,
  updateClass
} from "./classes.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listClasses(getUserId(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createClass(getUserId(req), req.body), 201);
});

export const week = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getWeeklyClasses(getUserId(req)));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await updateClass(getUserId(req), getIdParam(req), req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteClass(getUserId(req), getIdParam(req)));
});

