import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import {
  create,
  getById,
  list,
  remove,
  update,
} from "./companies.controller.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "./companies.schemas.js";

export const companiesRoutes = Router();

companiesRoutes.use(authenticate);
companiesRoutes.get("/", list);
companiesRoutes.get("/:id", getById);
companiesRoutes.post("/", validateBody(createCompanySchema), create);
companiesRoutes.put("/:id", validateBody(updateCompanySchema), update);
companiesRoutes.delete("/:id", remove);
