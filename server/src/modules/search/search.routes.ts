import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { userSearchRateLimit } from "../../middleware/rateLimit.js";
import { validateQuery } from "../../middleware/validate.js";
import { search } from "./search.controller.js";
import { searchQuerySchema } from "./search.schemas.js";

export const searchRoutes = Router();

searchRoutes.use(authenticate);
searchRoutes.use(userSearchRateLimit);
searchRoutes.get("/", validateQuery(searchQuerySchema), search);
