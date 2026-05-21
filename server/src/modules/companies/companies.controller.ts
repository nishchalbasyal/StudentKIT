import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIdParam, getUserId } from "../../utils/request.js";
import { CompaniesService } from "./companies.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await CompaniesService.getAllCompanies(getUserId(req)));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await CompaniesService.getCompanyById(getIdParam(req), getUserId(req)),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await CompaniesService.createCompany(getUserId(req), req.body),
    201,
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await CompaniesService.updateCompany(
      getIdParam(req),
      getUserId(req),
      req.body,
    ),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendData(
    res,
    await CompaniesService.deleteCompany(getIdParam(req), getUserId(req)),
  );
});
