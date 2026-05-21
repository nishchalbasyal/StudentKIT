import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import {
  getSettings,
  updateAI,
  updateNotifications,
  updatePreferences,
  updateSettings,
  updateWork,
} from "./settings.controller.js";
import {
  aiSettingsSchema,
  notificationSettingsSchema,
  preferenceSettingsSchema,
  updateSettingsSchema,
  workSettingsSchema,
} from "./settings.schemas.js";

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);
settingsRoutes.get("/", getSettings);
settingsRoutes.put("/", validateBody(updateSettingsSchema), updateSettings);
settingsRoutes.put("/notifications", validateBody(notificationSettingsSchema), updateNotifications);
settingsRoutes.put("/preferences", validateBody(preferenceSettingsSchema), updatePreferences);
settingsRoutes.put("/ai", validateBody(aiSettingsSchema), updateAI);
settingsRoutes.put("/work", validateBody(workSettingsSchema), updateWork);
