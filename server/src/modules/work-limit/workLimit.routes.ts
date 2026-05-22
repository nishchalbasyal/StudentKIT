import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import {
  dismissBanner,
  getSettings,
  getSummary,
  resetSettings,
  updateSettings,
} from "./workLimit.controller.js";
import { workLimitSettingsSchema } from "./workLimit.schemas.js";

export const workLimitRoutes = Router();

workLimitRoutes.use(authenticate);
workLimitRoutes.get("/", getSettings);
workLimitRoutes.get("/summary", getSummary);
workLimitRoutes.put("/", validateBody(workLimitSettingsSchema), updateSettings);
workLimitRoutes.post("/reset", resetSettings);
workLimitRoutes.post("/banner/dismiss", dismissBanner);
