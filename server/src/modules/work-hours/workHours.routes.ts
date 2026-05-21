import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  create,
  getById,
  list,
  monthlySummary,
  remove,
  update,
  weeklySummary,
} from "./workHours.controller.js";
import {
  monthlySummaryQuerySchema,
  updateWorkShiftSchema,
  weeklySummaryQuerySchema,
  workShiftSchema,
} from "./workHours.schemas.js";

export const workHoursRoutes = Router();

workHoursRoutes.use(authenticate);
workHoursRoutes.get("/", list);
workHoursRoutes.post("/", validateBody(workShiftSchema), create);
workHoursRoutes.get(
  "/summary/monthly",
  validateQuery(monthlySummaryQuerySchema),
  monthlySummary,
);
workHoursRoutes.get(
  "/summary/weekly",
  validateQuery(weeklySummaryQuerySchema),
  weeklySummary,
);
workHoursRoutes.get("/:id", getById);
workHoursRoutes.put("/:id", validateBody(updateWorkShiftSchema), update);
workHoursRoutes.delete("/:id", remove);
