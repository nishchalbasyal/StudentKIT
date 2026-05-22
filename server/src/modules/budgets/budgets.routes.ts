import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  create,
  current,
  getById,
  list,
  remove,
  summary,
  sync,
  update,
} from "./budgets.controller.js";
import {
  budgetSummaryQuerySchema,
  budgetSyncSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "./budgets.schemas.js";

export const budgetsRoutes = Router();

budgetsRoutes.use(authenticate);
budgetsRoutes.get("/", list);
budgetsRoutes.get("/current", current);
budgetsRoutes.get("/summary", validateQuery(budgetSummaryQuerySchema), summary);
budgetsRoutes.get("/:id", getById);
budgetsRoutes.post("/", validateBody(createBudgetSchema), create);
budgetsRoutes.post("/sync", validateBody(budgetSyncSchema), sync);
budgetsRoutes.put("/:id", validateBody(updateBudgetSchema), update);
budgetsRoutes.delete("/:id", remove);
