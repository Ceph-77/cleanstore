import { Router } from "express";
import * as controller from "./documents.controller";

/**
 * PDF (reçu de retrait, relevé mensuel) — autorisation par ressource
 * (le travailleur concerné, ou finance "view") faite dans le contrôleur,
 * pas de garde de rôle générique ici.
 */
export const documentsRouter = Router();
documentsRouter.get("/withdrawals/:id/receipt.pdf", controller.withdrawalReceipt);
documentsRouter.get("/workers/:id/statement.pdf", controller.monthlyStatement);
documentsRouter.get("/incidents/:id/report.pdf", controller.incidentReport);
