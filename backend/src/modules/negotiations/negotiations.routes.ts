import { Router } from "express";
import { requireCan, requireRole } from "../auth/auth.middleware";
import * as controller from "./negotiations.controller";

/**
 * Côté travailleur — montés sur le préfixe `/api/marketplace` déjà occupé par
 * `taskMarketplaceRouter` (taskClaims). Chaque route garde son propre
 * `requireRole` (pas de `.use()` en tête) pour ne pas intercepter les requêtes
 * de l'autre router sur le même préfixe — piège déjà rencontré (voir mémoire
 * "Marketplace pilier 2").
 */
export const negotiationsWorkerRouter = Router();
negotiationsWorkerRouter.post(
  "/tasks/:taskId/negotiations",
  requireRole("travailleur"),
  controller.open,
);
negotiationsWorkerRouter.post(
  "/negotiations/:id/offers",
  requireRole("travailleur"),
  controller.workerCounter,
);
negotiationsWorkerRouter.get(
  "/my-negotiations",
  requireRole("travailleur"),
  controller.listMine,
);

/** Côté gestion — préfixe dédié `/api/negotiations`, seul router dessus. */
export const negotiationsAdminRouter = Router();
negotiationsAdminRouter.get("/", requireCan("markettask", "view"), controller.list);
negotiationsAdminRouter.post("/:id/offers", requireCan("markettask", "manage"), controller.adminCounter);
negotiationsAdminRouter.post("/:id/accept", requireCan("markettask", "manage"), controller.accept);
negotiationsAdminRouter.post("/:id/reject", requireCan("markettask", "manage"), controller.reject);
