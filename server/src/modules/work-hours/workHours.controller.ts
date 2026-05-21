import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import {
  createWorkShift,
  deleteWorkShift,
  getMonthlyWorkSummary,
  getWeeklyWorkSummary,
  getWorkShiftById,
  listWorkShifts,
  updateWorkShift,
} from "./workHours.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await listWorkShifts(getUserId(req)));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getWorkShiftById(getUserId(req), getIdParam(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await createWorkShift(getUserId(req), req.body), 201);
});

export const monthlySummary = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(
      res,
      await getMonthlyWorkSummary(getUserId(req), req.query as never),
    );
  },
);

export const weeklySummary = asyncHandler(
  async (req: Request, res: Response) => {
    return sendData(
      res,
      await getWeeklyWorkSummary(getUserId(req), req.query as never),
    );
  },
);

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await updateWorkShift(getUserId(req), getIdParam(req), req.body),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await deleteWorkShift(getUserId(req), getIdParam(req)));
});
