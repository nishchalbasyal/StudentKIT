import type { Router } from "express";
import { aiRoutes } from "./ai/ai.routes.js";
import { authRoutes } from "./auth/auth.routes.js";
import { budgetsRoutes } from "./budgets/budgets.routes.js";
import { classesRoutes } from "./classes/classes.routes.js";
import { cleaningRoutes } from "./cleaning/cleaning.routes.js";
import { companiesRoutes } from "./companies/companies.routes.js";
import { couponsRoutes } from "./coupons/coupons.routes.js";
import { eventsRoutes } from "./events/events.routes.js";
import { expensesRoutes } from "./expenses/expenses.routes.js";
import { featuresRoutes } from "./features/features.routes.js";
import { groceriesRoutes } from "./groceries/groceries.routes.js";
import { remindersRoutes } from "./reminders/reminders.routes.js";
import { searchRoutes } from "./search/search.routes.js";
import { settingsRoutes } from "./settings/settings.routes.js";
import { splitRoutes } from "./split/split.routes.js";
import { syncRoutes } from "./sync/sync.routes.js";
import { tasksRoutes } from "./tasks/tasks.routes.js";
import { usersRoutes } from "./users/users.routes.js";
import { workHoursRoutes } from "./work-hours/workHours.routes.js";
import { workLimitRoutes } from "./work-limit/workLimit.routes.js";

type MountedRoute = {
  path: string;
  router: Router;
};

export const apiRoutes: MountedRoute[] = [
  { path: "/api/auth", router: authRoutes },
  { path: "/api", router: usersRoutes },
  { path: "/api/companies", router: companiesRoutes },
  { path: "/api/work-shifts", router: workHoursRoutes },
  { path: "/api/work-limit", router: workLimitRoutes },
  { path: "/api/expenses", router: expensesRoutes },
  { path: "/api/budgets", router: budgetsRoutes },
  { path: "/api/settings", router: settingsRoutes },
  { path: "/api/sync", router: syncRoutes },
  { path: "/api/split", router: splitRoutes },
  { path: "/api/classes", router: classesRoutes },
  { path: "/api/tasks", router: tasksRoutes },
  { path: "/api/reminders", router: remindersRoutes },
  { path: "/api/cleaning", router: cleaningRoutes },
  { path: "/api/groceries", router: groceriesRoutes },
  { path: "/api/ai", router: aiRoutes },
  { path: "/api/features", router: featuresRoutes },
  { path: "/api/search", router: searchRoutes },
  { path: "/api/coupons", router: couponsRoutes },
  { path: "/api/events", router: eventsRoutes },
];
