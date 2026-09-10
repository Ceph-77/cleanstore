import { Router } from "express";
import { requireCan } from "../auth/auth.middleware";
import * as auditController from "./audit.controller";

/** Lecture du journal d'audit — tout rôle ayant `audit:view` (admin, comptable, développeur). */
export const auditAdminRouter = Router();
auditAdminRouter.use(requireCan("audit", "view"));
auditAdminRouter.get("/", auditController.list);
