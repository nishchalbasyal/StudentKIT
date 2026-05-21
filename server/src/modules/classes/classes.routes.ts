import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { create, list, remove, update, week } from "./classes.controller.js";
import { classScheduleSchema, updateClassScheduleSchema } from "./classes.schemas.js";

export const classesRoutes = Router();

classesRoutes.use(authenticate);
classesRoutes.get("/", list);
classesRoutes.post("/", validateBody(classScheduleSchema), create);
classesRoutes.get("/week", week);
classesRoutes.put("/:id", validateBody(updateClassScheduleSchema), update);
classesRoutes.delete("/:id", remove);

