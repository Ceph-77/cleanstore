import { Router } from "express";
import { requireCan } from "../auth/auth.middleware";
import * as controller from "./ledger.controller";

/** Grand livre — accès aux rôles ayant finance:view (admin, comptable). */
export const ledgerRouter = Router();
ledgerRouter.use(requireCan("finance", "view"));
ledgerRouter.get("/", controller.list);
ledgerRouter.get("/summary", controller.summary);
ledgerRouter.get("/export.csv", controller.exportCsv);
