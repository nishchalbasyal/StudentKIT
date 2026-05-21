import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { validateParams } from "../../middleware/validate.js";
import { getById, list } from "./events.controller.js";

export const eventsRoutes = Router();

eventsRoutes.use(authenticate);
eventsRoutes.get("/", list);
eventsRoutes.get("/:id", validateParams(z.object({ id: z.string().min(1) })), getById);
