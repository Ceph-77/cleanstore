import { Router } from "express";
import express from "express";
import { requireRole } from "../auth/auth.middleware";
import * as paymentsController from "./payments.controller";

export const paymentsRouter = Router();
paymentsRouter.post("/funding-method", requireRole("sous_traitant"), paymentsController.saveFundingMethod);
paymentsRouter.post("/connect/onboard", requireRole("travailleur"), paymentsController.connectOnboard);
paymentsRouter.get("/balance", requireRole("travailleur"), paymentsController.getBalance);
paymentsRouter.get("/history", requireRole("travailleur"), paymentsController.getHistory);
paymentsRouter.post("/withdraw", requireRole("travailleur"), paymentsController.withdraw);
paymentsRouter.get("/settings", requireRole("admin"), paymentsController.getSettings);
paymentsRouter.patch("/settings", requireRole("admin"), paymentsController.updateSettings);

export const paymentsWebhookRouter = Router();
paymentsWebhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentsController.webhook
);
