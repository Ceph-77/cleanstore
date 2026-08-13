import { Router } from "express";
import * as storeContactsController from "./storeContacts.controller";

export const storeContactsRouterForStore = Router({ mergeParams: true });
storeContactsRouterForStore.get("/", storeContactsController.list);
storeContactsRouterForStore.post("/", storeContactsController.create);

export const storeContactsRouter = Router();
storeContactsRouter.patch("/:id", storeContactsController.update);
storeContactsRouter.delete("/:id", storeContactsController.remove);
