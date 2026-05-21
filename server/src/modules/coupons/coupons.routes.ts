import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { validateParams } from "../../middleware/validate.js";
import { getById, list } from "./coupons.controller.js";

export const couponsRoutes = Router();

couponsRoutes.use(authenticate);
couponsRoutes.get("/", list);
couponsRoutes.get("/:id", validateParams(z.object({ id: z.string().min(1) })), getById);
