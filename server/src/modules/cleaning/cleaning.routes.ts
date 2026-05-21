import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { complete, create, list, remove, update } from "./cleaning.controller.js";
import { cleaningTaskSchema, updateCleaningTaskSchema } from "./cleaning.schemas.js";

export const cleaningRoutes = Router();

cleaningRoutes.use(authenticate);
cleaningRoutes.get("/", list);
cleaningRoutes.post("/", validateBody(cleaningTaskSchema), create);
cleaningRoutes.patch("/:id/complete", complete);
cleaningRoutes.put("/:id", validateBody(updateCleaningTaskSchema), update);
cleaningRoutes.delete("/:id", remove);

