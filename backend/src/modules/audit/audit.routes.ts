import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as auditController from "./audit.controller";

/**
 * Lecture du journal d'audit. Admin uniquement pour l'instant ; l'ouverture aux
 * rôles `comptable` / `developpeur` (qui ont `audit: view` dans la matrice) se
 * fera avec le passage de `requireRole` à une garde basée sur `can()`
 * (tranche 2 — multi-rôle).
 */
export const auditAdminRouter = Router();
auditAdminRouter.use(requireRole("admin"));
auditAdminRouter.get("/", auditController.list);
