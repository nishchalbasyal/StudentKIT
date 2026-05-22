import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { aiRateLimit } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import {
  expenseAdvice,
  groceryAdvice,
  latestInsights,
  requestAI,
  status,
  studyPlan,
  weeklySummary,
  workLimitWarning,
} from "./ai.controller.js";
import { studyPlanSchema } from "./ai.schemas.js";

export const aiRoutes = Router();

aiRoutes.use(authenticate);
aiRoutes.use(aiRateLimit);
aiRoutes.get("/status", status);
aiRoutes.post("/request", requestAI);
aiRoutes.get("/insights/latest", latestInsights);
aiRoutes.post("/expense-advice", expenseAdvice);
aiRoutes.post("/weekly-summary", weeklySummary);
aiRoutes.post("/grocery-advice", groceryAdvice);
aiRoutes.post("/study-plan", validateBody(studyPlanSchema), studyPlan);
aiRoutes.post("/work-limit-warning", workLimitWarning);
