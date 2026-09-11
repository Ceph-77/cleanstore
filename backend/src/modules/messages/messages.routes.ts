import { Router } from "express";
import * as controller from "./messages.controller";
import { requireRole } from "../auth/auth.middleware";

/**
 * Messagerie transversale — tous les rôles authentifiés l'utilisent (fil de
 * tâche, de clan, Jazzette, Annonces, discussions libres), donc pas de
 * `requireRole`/`requireCan` de section ici ; l'autorisation par fil se fait
 * dans `messages.service` (appartenance à la tâche/au clan, participant du
 * fil libre, admin qui modère tout).
 */
export const messagesRouter = Router();
messagesRouter.get("/threads/mine", controller.listMine);
messagesRouter.get("/threads/global/:kind", controller.global);
messagesRouter.get("/threads/task/:taskId", controller.taskThread);
messagesRouter.get("/threads/clan/:clanId", controller.clanThread);
messagesRouter.post("/threads/adhoc", controller.createAdhoc);
messagesRouter.get("/threads/:id/messages", controller.listMessages);
messagesRouter.post("/threads/:id/messages", controller.postMessage);
messagesRouter.patch("/messages/:id", controller.editMessage);

/** Modération — tous les fils actifs, admin seulement. */
export const messagesAdminRouter = Router();
messagesAdminRouter.use(requireRole("admin"));
messagesAdminRouter.get("/", controller.listAll);
