import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as organizationsController from "./organizations.controller";

export const organizationsRouter = Router();

organizationsRouter.use(requireRole("admin"));
organizationsRouter.get("/", organizationsController.list);
organizationsRouter.post("/", organizationsController.create);
