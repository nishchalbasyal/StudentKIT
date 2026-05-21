import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import { searchAll } from "./search.service.js";
import type { SearchQuery } from "./search.schemas.js";

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as unknown as SearchQuery;
  return sendData(res, await searchAll(getUserId(req), q));
});
