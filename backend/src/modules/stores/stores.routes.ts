import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as storesController from "./stores.controller";
import { tasksRouterForStore } from "../tasks/tasks.routes";
import { storeContactsRouterForStore } from "../storeContacts/storeContacts.routes";
import { storeNotesRouterForStore } from "../storeNotes/storeNotes.routes";
import { storeDocumentsRouterForStore } from "../storeDocuments/storeDocuments.routes";
import { storeInvoicesRouterForStore } from "../storeInvoices/storeInvoices.routes";

export const storesRouter = Router();

storesRouter.use(requireRole("admin"));

storesRouter.get("/", storesController.list);
storesRouter.post("/", storesController.create);
storesRouter.get("/map-points", storesController.listMapPoints);
storesRouter.get("/:id", storesController.getOne);
storesRouter.patch("/:id", storesController.update);
storesRouter.patch("/:id/archive", storesController.archive);

storesRouter.use("/:storeId/tasks", tasksRouterForStore);
storesRouter.use("/:storeId/contacts", storeContactsRouterForStore);
storesRouter.use("/:storeId/notes", storeNotesRouterForStore);
storesRouter.use("/:storeId/documents", storeDocumentsRouterForStore);
storesRouter.use("/:storeId/invoices", storeInvoicesRouterForStore);
