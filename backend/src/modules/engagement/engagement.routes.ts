import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as engagementController from "./engagement.controller";

export const engagementRouter = Router();

// Worker-facing progression + celebration queue
engagementRouter.get("/me", requireRole("travailleur"), engagementController.mySummary);
engagementRouter.get("/moments/unseen", requireRole("travailleur"), engagementController.unseenMoments);
engagementRouter.post("/moments/seen", requireRole("travailleur"), engagementController.markAllSeen);
engagementRouter.post("/moments/:id/seen", requireRole("travailleur"), engagementController.markMomentSeen);
engagementRouter.get("/streak", requireRole("travailleur"), engagementController.streakStrip);
engagementRouter.get("/streak/:date", requireRole("travailleur"), engagementController.dayTasks);

// Leaderboard — admin + sous-traitant
engagementRouter.get(
  "/leaderboard",
  requireRole("admin", "sous_traitant"),
  engagementController.leaderboard
);

// Admin: inspect any worker's streak + record past (off-app) work
engagementRouter.get(
  "/workers/:workerId/summary",
  requireRole("admin"),
  engagementController.workerSummary
);
engagementRouter.get(
  "/workers/:workerId/streak",
  requireRole("admin"),
  engagementController.workerStreak
);
engagementRouter.get(
  "/workers/:workerId/streak/:date",
  requireRole("admin"),
  engagementController.workerDayTasks
);
engagementRouter.post(
  "/workers/:workerId/past-tasks",
  requireRole("admin"),
  engagementController.addPastTask
);
engagementRouter.patch(
  "/workers/:workerId/past-tasks/:taskId",
  requireRole("admin"),
  engagementController.updatePastTask
);
engagementRouter.delete(
  "/workers/:workerId/past-tasks/:taskId",
  requireRole("admin"),
  engagementController.deletePastTask
);
