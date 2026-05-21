import type { Response } from "express";
import type { ApiErrorCode } from "./httpError.js";

export function sendData<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ data });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details
    }
  });
}

