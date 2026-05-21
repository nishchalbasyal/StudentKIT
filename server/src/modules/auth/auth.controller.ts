import type { Request, Response } from "express";
import { sendData } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getCurrentUser,
  loginUser,
  refreshToken,
  registerUser,
  updateUserProfile
} from "./auth.service.js";
import { authenticateWithGoogle } from "./google-oauth.service.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  return sendData(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  return sendData(res, result);
});

export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const result = await authenticateWithGoogle(req.body.idToken);
  return sendData(res, result, 201);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshToken(req.body.refreshToken);
  return sendData(res, result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await getCurrentUser(req.user!.id);
  return sendData(res, result);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateUserProfile(req.user!.id, req.body);
  return sendData(res, result);
});

