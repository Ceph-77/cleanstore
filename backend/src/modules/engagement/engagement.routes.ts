import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as engagementController from "./engagement.controller";

export const engagementRouter = Router();

// Worker-facing progression + celebration queue
engagementRouter.get("/me", requireRole("travailleur"), engagementController.mySummary);
engagementRouter.get("/moments/unseen", requireRole("travailleur"), engagementController.unseenMoments);
engagementRouter.post("/moments/seen", requireRole("travailleur"), engagementController.markAllSeen);
engagementRouter.post("/moments/:id/seen", requireRole("travailleur"), engagementController.markMomentSeen);

// Leaderboard — admin + sous-traitant
engagementRouter.get(
  "/leaderboard",
  requireRole("admin", "sous_traitant"),
  engagementController.leaderboard
);
