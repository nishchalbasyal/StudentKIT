import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { complete, create, list, remove, sync, update } from "./reminders.controller.js";
import { reminderSchema, remindersSyncSchema } from "./reminders.schemas.js";

export const remindersRoutes = Router();

remindersRoutes.use(authenticate);
remindersRoutes.get("/", list);
remindersRoutes.post("/", validateBody(reminderSchema), create);
remindersRoutes.put("/:id", validateBody(reminderSchema), update);
remindersRoutes.patch("/:id/complete", complete);
remindersRoutes.delete("/:id", remove);
remindersRoutes.post("/sync", validateBody(remindersSyncSchema), sync);
