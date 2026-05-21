import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { processItem } from "./sync.controller.js";
import { syncQueueItemSchema } from "./sync.schemas.js";

export const syncRoutes = Router();

syncRoutes.use(authenticate);
syncRoutes.post("/", validateBody(syncQueueItemSchema), processItem);
