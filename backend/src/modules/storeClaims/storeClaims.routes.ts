import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as storeClaimsController from "./storeClaims.controller";

export const storeMarketplaceRouter = Router();
storeMarketplaceRouter.get("/stores", requireRole("sous_traitant"), storeClaimsController.listAvailable);
storeMarketplaceRouter.post(
  "/stores/:storeId/claims",
  requireRole("sous_traitant"),
  storeClaimsController.create
);
storeMarketplaceRouter.get("/my-store-claims", requireRole("sous_traitant"), storeClaimsController.listMine);

export const storeClaimsAdminRouter = Router();
storeClaimsAdminRouter.use(requireRole("admin"));
storeClaimsAdminRouter.get("/", storeClaimsController.list);
storeClaimsAdminRouter.patch("/:id", storeClaimsController.decide);
