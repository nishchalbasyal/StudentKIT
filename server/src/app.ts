import cors from "cors";
import type { CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { budgetsRoutes } from "./modules/budgets/budgets.routes.js";
import { classesRoutes } from "./modules/classes/classes.routes.js";
import { cleaningRoutes } from "./modules/cleaning/cleaning.routes.js";
import { companiesRoutes } from "./modules/companies/companies.routes.js";
import { couponsRoutes } from "./modules/coupons/coupons.routes.js";
import { expensesRoutes } from "./modules/expenses/expenses.routes.js";
import { eventsRoutes } from "./modules/events/events.routes.js";
import { groceriesRoutes } from "./modules/groceries/groceries.routes.js";
import { remindersRoutes } from "./modules/reminders/reminders.routes.js";
import { searchRoutes } from "./modules/search/search.routes.js";
import { settingsRoutes } from "./modules/settings/settings.routes.js";
import { splitRoutes } from "./modules/split/split.routes.js";
import { syncRoutes } from "./modules/sync/sync.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { workHoursRoutes } from "./modules/work-hours/workHours.routes.js";

const app = express();

const configuredCorsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isDevelopmentOriginAllowed(origin: string) {
  try {
    const { hostname, protocol } = new URL(origin);
    const isHttp = protocol === "http:" || protocol === "https:";
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isPrivateLan =
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    return isHttp && (isLocalhost || isPrivateLan);
  } catch {
    return false;
  }
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (configuredCorsOrigins.includes(origin) || (env.NODE_ENV === "development" && isDevelopmentOriginAllowed(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({ data: { status: "ok", service: "student-kit-api" } });
});

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/work-shifts", workHoursRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/split", splitRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/reminders", remindersRoutes);
app.use("/api/cleaning", cleaningRoutes);
app.use("/api/groceries", groceriesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/events", eventsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
