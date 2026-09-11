import { Router } from "express";
import * as feedbackController from "./feedback.controller";
import { requireCan } from "../auth/auth.middleware";

export const feedbackRouter = Router();
feedbackRouter.post("/", feedbackController.create);
feedbackRouter.get("/", requireCan("feedback", "view"), feedbackController.list);
feedbackRouter.patch("/:id", requireCan("feedback", "manage"), feedbackController.update);
feedbackRouter.post("/:id/convert-to-incident", requireCan("feedback", "manage"), feedbackController.convertToIncident);
feedbackRouter.delete("/:id", requireCan("feedback", "manage"), feedbackController.remove);
