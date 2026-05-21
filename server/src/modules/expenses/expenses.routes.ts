import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  categorySummary,
  create,
  createBudgetRecord,
  deleteBudgetRecord,
  list,
  listBudgetRecords,
  monthlySummary,
  remove,
  update,
  updateBudgetRecord
} from "./expenses.controller.js";
import {
  budgetSchema,
  categorySummaryQuerySchema,
  expenseSchema,
  monthlyExpenseQuerySchema,
  updateBudgetSchema,
  updateExpenseSchema
} from "./expenses.schemas.js";

export const expensesRoutes = Router();
export const budgetsRoutes = Router();

expensesRoutes.use(authenticate);
expensesRoutes.get("/", list);
expensesRoutes.post("/", validateBody(expenseSchema), create);
expensesRoutes.get("/summary/monthly", validateQuery(monthlyExpenseQuerySchema), monthlySummary);
expensesRoutes.get("/category-summary", validateQuery(categorySummaryQuerySchema), categorySummary);
expensesRoutes.put("/:id", validateBody(updateExpenseSchema), update);
expensesRoutes.delete("/:id", remove);

budgetsRoutes.use(authenticate);
budgetsRoutes.get("/", validateQuery(categorySummaryQuerySchema), listBudgetRecords);
budgetsRoutes.post("/", validateBody(budgetSchema), createBudgetRecord);
budgetsRoutes.put("/:id", validateBody(updateBudgetSchema), updateBudgetRecord);
budgetsRoutes.delete("/:id", deleteBudgetRecord);

