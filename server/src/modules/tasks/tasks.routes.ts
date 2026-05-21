import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { complete, create, list, remove, upcoming, update } from "./tasks.controller.js";
import { taskSchema, updateTaskSchema } from "./tasks.schemas.js";

export const tasksRoutes = Router();

tasksRoutes.use(authenticate);
tasksRoutes.get("/", list);
tasksRoutes.post("/", validateBody(taskSchema), create);
tasksRoutes.get("/upcoming", upcoming);
tasksRoutes.put("/:id", validateBody(updateTaskSchema), update);
tasksRoutes.patch("/:id/complete", complete);
tasksRoutes.delete("/:id", remove);

