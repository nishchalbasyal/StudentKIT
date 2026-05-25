import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authRateLimit, userSearchRateLimit } from "../../middleware/rateLimit.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { dashboard } from "./dashboard.controller.js";
import {
  deleteMe,
  getMe,
  getMySummary,
  register,
  searchUsers,
  updateAvatar,
  updateMe,
} from "./users.controller.js";
import {
  avatarSchema,
  registerUserSchema,
  updateUserMeSchema,
  userSearchQuerySchema,
} from "./users.schemas.js";

export const usersRoutes = Router();

usersRoutes.post("/users/register", authRateLimit, validateBody(registerUserSchema), register);
usersRoutes.use(authenticate);
usersRoutes.get("/dashboard", dashboard);
usersRoutes.get("/users/me", getMe);
usersRoutes.put("/users/me", validateBody(updateUserMeSchema), updateMe);
usersRoutes.post("/users/avatar", validateBody(avatarSchema), updateAvatar);
usersRoutes.get("/users/me/summary", getMySummary);
usersRoutes.delete("/users/me", deleteMe);
usersRoutes.get("/users/search", userSearchRateLimit, validateQuery(userSearchQuerySchema), searchUsers);
