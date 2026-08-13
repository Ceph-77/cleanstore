import { Router } from "express";
import multer from "multer";
import * as storeDocumentsController from "./storeDocuments.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const storeDocumentsRouterForStore = Router({ mergeParams: true });
storeDocumentsRouterForStore.get("/", storeDocumentsController.list);
storeDocumentsRouterForStore.post("/", upload.single("file"), storeDocumentsController.create);

export const storeDocumentsRouter = Router();
storeDocumentsRouter.delete("/:id", storeDocumentsController.remove);
