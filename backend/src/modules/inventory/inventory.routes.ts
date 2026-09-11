import { Router } from "express";
import { requireCan } from "../auth/auth.middleware";
import * as controller from "./inventory.controller";

/**
 * Équipements / stock. Accès via can("inventory", …) plutôt que requireRole :
 * admin par défaut, cochable pour mécanicien/dépanneur sans toucher aux routes.
 */
export const inventoryRouter = Router();
inventoryRouter.get("/alerts", requireCan("inventory", "view"), controller.alerts);
inventoryRouter.get("/alerts/items", requireCan("inventory", "view"), controller.alertItems);
inventoryRouter.get("/stores/:storeId", requireCan("inventory", "view"), controller.list);
inventoryRouter.post("/stores/:storeId", requireCan("inventory", "manage"), controller.create);
inventoryRouter.patch("/:id", requireCan("inventory", "manage"), controller.update);
inventoryRouter.delete("/:id", requireCan("inventory", "manage"), controller.remove);
inventoryRouter.post("/:id/restock", requireCan("inventory", "manage"), controller.restock);
inventoryRouter.get("/:id/movements", requireCan("inventory", "view"), controller.movements);
