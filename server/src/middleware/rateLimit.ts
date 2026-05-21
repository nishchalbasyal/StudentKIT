import rateLimit from "express-rate-limit";
import { isProduction } from "../config/env.js";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please try again soon."
    }
  }
});

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 20 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many AI requests. Please wait a moment."
    }
  }
});

export const userSearchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 30 : 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many user searches. Please wait a moment."
    }
  }
});
