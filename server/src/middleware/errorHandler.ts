import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env.js";
import { sendError } from "../utils/apiResponse.js";
import { HttpError } from "../utils/httpError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Request validation failed", error.flatten());
  }

  if (error instanceof HttpError) {
    return sendError(res, error.statusCode, error.code, error.message, error.details);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return sendError(res, 404, "NOT_FOUND", "Record not found");
    }

    if (error.code === "P2002") {
      return sendError(res, 409, "CONFLICT", "A record with this value already exists");
    }
  }

  const details = isProduction ? undefined : error;
  return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong", details);
}

