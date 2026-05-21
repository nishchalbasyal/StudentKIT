import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam } from "../../utils/request.js";
import { getCoupon, listCoupons } from "./coupons.service.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  return sendData(res, await listCoupons());
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await getCoupon(getIdParam(req)));
});
