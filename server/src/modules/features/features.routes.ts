import { Router } from "express";
import { getFeatures } from "./features.controller.js";

export const featuresRoutes = Router();

featuresRoutes.get("/", getFeatures);
