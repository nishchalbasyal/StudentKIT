import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  categorySummary,
  create,
  list,
  monthlySummary,
  remove,
  update
} from "./expenses.controller.js";
import {
  categorySummaryQuerySchema,
  expenseSchema,
  monthlyExpenseQuerySchema,
  updateExpenseSchema
} from "./expenses.schemas.js";

export const expensesRoutes = Router();

expensesRoutes.use(authenticate);
expensesRoutes.get("/", list);
expensesRoutes.post("/", validateBody(expenseSchema), create);
expensesRoutes.get("/summary/monthly", validateQuery(monthlyExpenseQuerySchema), monthlySummary);
expensesRoutes.get("/category-summary", validateQuery(categorySummaryQuerySchema), categorySummary);
expensesRoutes.put("/:id", validateBody(updateExpenseSchema), update);
expensesRoutes.delete("/:id", remove);
