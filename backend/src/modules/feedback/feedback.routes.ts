import { Router } from "express";
import * as feedbackController from "./feedback.controller";
import { requireRole } from "../auth/auth.middleware";

export const feedbackRouter = Router();
feedbackRouter.post("/", feedbackController.create);
feedbackRouter.get("/", requireRole("admin"), feedbackController.list);
feedbackRouter.delete("/:id", requireRole("admin"), feedbackController.remove);
