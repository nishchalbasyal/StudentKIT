import type { Request } from "express";
import { HttpError } from "./httpError.js";

export function getUserId(req: Request) {
  if (!req.user) {
    throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
  }

  return req.user.id;
}

export function getIdParam(req: Request, name = "id") {
  const value = req.params[name];

  if (!value) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing route parameter: ${name}`);
  }

  return value;
}

