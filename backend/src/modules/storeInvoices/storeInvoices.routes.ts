import { Router } from "express";
import * as storeInvoicesController from "./storeInvoices.controller";

export const storeInvoicesRouterForStore = Router({ mergeParams: true });
storeInvoicesRouterForStore.get("/", storeInvoicesController.list);
storeInvoicesRouterForStore.post("/", storeInvoicesController.create);

export const storeInvoicesRouter = Router();
storeInvoicesRouter.patch("/:id", storeInvoicesController.update);
storeInvoicesRouter.delete("/:id", storeInvoicesController.remove);
