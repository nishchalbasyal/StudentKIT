import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/httpError.js";

type AccessTokenPayload = {
  sub: string;
};

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return next(new HttpError(401, "AUTHENTICATION_REQUIRED", "Missing access token"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        country: true,
        studentStatus: true,
        currency: true
      }
    });

    if (!user) {
      return next(new HttpError(401, "AUTHENTICATION_REQUIRED", "User no longer exists"));
    }

    req.user = user;
    return next();
  } catch {
    return next(new HttpError(401, "AUTHENTICATION_REQUIRED", "Invalid or expired access token"));
  }
}

