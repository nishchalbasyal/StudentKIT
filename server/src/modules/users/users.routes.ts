import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { userSearchRateLimit } from "../../middleware/rateLimit.js";
import { validateQuery } from "../../middleware/validate.js";
import { validateBody } from "../../middleware/validate.js";
import { dashboard } from "./dashboard.controller.js";
import { deleteMe, getMe, getMySummary, searchUsers, updateAvatar, updateMe } from "./users.controller.js";
import { avatarSchema, updateUserMeSchema, userSearchQuerySchema } from "./users.schemas.js";

export const usersRoutes = Router();

usersRoutes.use(authenticate);
usersRoutes.get("/dashboard", dashboard);
usersRoutes.get("/users/me", getMe);
usersRoutes.put("/users/me", validateBody(updateUserMeSchema), updateMe);
usersRoutes.post("/users/avatar", validateBody(avatarSchema), updateAvatar);
usersRoutes.get("/users/me/summary", getMySummary);
usersRoutes.delete("/users/me", deleteMe);
usersRoutes.get("/users/search", userSearchRateLimit, validateQuery(userSearchQuerySchema), searchUsers);
