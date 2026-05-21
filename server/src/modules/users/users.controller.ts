import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getUserId } from "../../utils/request.js";
import { UsersService } from "./users.service.js";
import type { UserSearchQuery } from "./users.schemas.js";

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as unknown as UserSearchQuery;
  const currentUserId = getUserId(req);
  return sendData(res, await UsersService.searchUsers(q, currentUserId));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await UsersService.getMe(getUserId(req)));
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await UsersService.updateMe(getUserId(req), req.body));
});

export const getMySummary = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await UsersService.getSummary(getUserId(req)));
});

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await UsersService.deleteMe(getUserId(req)));
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  return sendData(res, await UsersService.updateAvatar(getUserId(req), req.body));
});
