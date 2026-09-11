import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { requireRole, sessionRoles } from "../auth/auth.middleware";
import { can } from "../auth/permissions";
import * as paymentsController from "./payments.controller";

/**
 * Pénalité/prime : geste financier (comptable) autant qu'une décision liée à
 * une tâche/inspection (inspecteur) — `requireCan` ne teste qu'une section à
 * la fois, donc garde dédiée qui accepte l'une OU l'autre.
 */
function requireFinanceOrMarkettaskManage(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const roles = sessionRoles(req);
  if (can(roles, "finance", "manage") || can(roles, "markettask", "manage")) return next();
  return res.status(403).json({ error: "Forbidden" });
}

export const paymentsRouter = Router();
paymentsRouter.post("/funding-method", requireRole("sous_traitant"), paymentsController.saveFundingMethod);
paymentsRouter.post("/connect/onboard", requireRole("travailleur"), paymentsController.connectOnboard);
paymentsRouter.get("/balance", requireRole("travailleur"), paymentsController.getBalance);
paymentsRouter.get("/history", requireRole("travailleur"), paymentsController.getHistory);
paymentsRouter.post("/withdraw", requireRole("travailleur"), paymentsController.withdraw);
paymentsRouter.get("/settings", requireRole("admin"), paymentsController.getSettings);
paymentsRouter.patch("/settings", requireRole("admin"), paymentsController.updateSettings);
paymentsRouter.post("/adjustments", requireFinanceOrMarkettaskManage, paymentsController.applyAdjustment);

export const paymentsWebhookRouter = Router();
paymentsWebhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentsController.webhook
);
