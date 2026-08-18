import { Router } from "express";
import multer from "multer";
import { requireRole } from "../auth/auth.middleware";
import * as taskInstructionsController from "./taskInstructions.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const taskInstructionsRouter = Router();

taskInstructionsRouter.get("/", requireRole("sous_traitant"), taskInstructionsController.listMine);
taskInstructionsRouter.get("/:taskId", requireRole("admin", "sous_traitant"), taskInstructionsController.get);
taskInstructionsRouter.patch("/:taskId", requireRole("admin", "sous_traitant"), taskInstructionsController.update);
taskInstructionsRouter.post(
  "/:taskId/photos",
  requireRole("admin", "sous_traitant"),
  upload.array("photos", 5),
  taskInstructionsController.addPhoto
);
taskInstructionsRouter.delete(
  "/:taskId/photos/:photoId",
  requireRole("admin", "sous_traitant"),
  taskInstructionsController.deletePhoto
);
taskInstructionsRouter.post(
  "/:taskId/steps",
  requireRole("admin", "sous_traitant"),
  taskInstructionsController.addStep
);
taskInstructionsRouter.patch(
  "/:taskId/steps/:stepId",
  requireRole("admin", "sous_traitant"),
  taskInstructionsController.updateStep
);
taskInstructionsRouter.delete(
  "/:taskId/steps/:stepId",
  requireRole("admin", "sous_traitant"),
  taskInstructionsController.deleteStep
);
