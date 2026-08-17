import { Router } from "express";
import * as storeNotesController from "./storeNotes.controller";

export const storeNotesRouterForStore = Router({ mergeParams: true });
storeNotesRouterForStore.get("/", storeNotesController.list);
storeNotesRouterForStore.post("/", storeNotesController.create);

export const storeNotesRouter = Router();
storeNotesRouter.patch("/:id", storeNotesController.update);
storeNotesRouter.delete("/:id", storeNotesController.remove);
