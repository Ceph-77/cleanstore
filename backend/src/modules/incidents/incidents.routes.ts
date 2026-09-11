import { Router } from "express";
import { requireCan } from "../auth/auth.middleware";
import * as controller from "./incidents.controller";

/**
 * Signaler un incident est ouvert à TOUT user connecté (bouton toujours
 * accessible, Q41-43) — seule la consultation/le traitement passe par la
 * permission `feedback` (section "Feedback & incidents" du Lot 0).
 */
export const incidentsRouter = Router();
incidentsRouter.post("/", controller.create);
incidentsRouter.get("/", requireCan("feedback", "view"), controller.list);
incidentsRouter.get("/:id", requireCan("feedback", "view"), controller.get);
incidentsRouter.patch("/:id", requireCan("feedback", "manage"), controller.update);
incidentsRouter.post("/:id/notes", requireCan("feedback", "manage"), controller.addNote);
