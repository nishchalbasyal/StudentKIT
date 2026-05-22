import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { pullItems, processItem } from "./sync.controller.js";
import { syncPullQuerySchema, syncQueueItemSchema } from "./sync.schemas.js";

export const syncRoutes = Router();

syncRoutes.use(authenticate);
syncRoutes.post("/", validateBody(syncQueueItemSchema), processItem);
syncRoutes.post("/push", validateBody(syncQueueItemSchema), processItem);
syncRoutes.get("/pull", validateQuery(syncPullQuerySchema), pullItems);
