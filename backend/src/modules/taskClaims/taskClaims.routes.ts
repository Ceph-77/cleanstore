import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as taskClaimsController from "./taskClaims.controller";

export const taskMarketplaceRouter = Router();
taskMarketplaceRouter.get("/tasks", requireRole("travailleur"), taskClaimsController.listMarketplace);
taskMarketplaceRouter.post(
  "/tasks/:taskId/claims",
  requireRole("travailleur"),
  taskClaimsController.create
);
taskMarketplaceRouter.get("/my-task-claims", requireRole("travailleur"), taskClaimsController.listMine);
taskMarketplaceRouter.get(
  "/assignable-workers",
  requireRole("sous_traitant"),
  taskClaimsController.assignableWorkers
);
taskMarketplaceRouter.post(
  "/direct-assign",
  requireRole("sous_traitant"),
  taskClaimsController.directAssign
);

export const taskClaimsAdminRouter = Router();
taskClaimsAdminRouter.use(requireRole("admin"));
taskClaimsAdminRouter.get("/", taskClaimsController.list);
taskClaimsAdminRouter.patch("/:id", taskClaimsController.decide);
