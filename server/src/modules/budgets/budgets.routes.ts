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
  update,
} from "./budgets.controller.js";
import { budgetSummaryQuerySchema, createBudgetSchema, updateBudgetSchema } from "./budgets.schemas.js";

export const budgetsRoutes = Router();

budgetsRoutes.use(authenticate);
budgetsRoutes.get("/", list);
budgetsRoutes.get("/current", current);
budgetsRoutes.get("/summary", validateQuery(budgetSummaryQuerySchema), summary);
budgetsRoutes.get("/:id", getById);
budgetsRoutes.post("/", validateBody(createBudgetSchema), create);
budgetsRoutes.put("/:id", validateBody(updateBudgetSchema), update);
budgetsRoutes.delete("/:id", remove);
