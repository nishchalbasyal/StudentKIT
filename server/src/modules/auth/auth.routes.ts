import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import { login, me, refresh, register, googleSignIn, updateMe } from "./auth.controller.js";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  googleSignInSchema,
  updateProfileSchema
} from "./auth.schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimit, validateBody(registerSchema), register);
authRoutes.post("/login", authRateLimit, validateBody(loginSchema), login);
authRoutes.post("/google-signin", authRateLimit, validateBody(googleSignInSchema), googleSignIn);
authRoutes.post("/refresh", authRateLimit, validateBody(refreshTokenSchema), refresh);
authRoutes.get("/me", authenticate, me);
authRoutes.patch("/me", authenticate, validateBody(updateProfileSchema), updateMe);
