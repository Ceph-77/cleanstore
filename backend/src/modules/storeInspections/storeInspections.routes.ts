import { Router } from "express";
import multer from "multer";
import * as storeInspectionsController from "./storeInspections.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const storeInspectionsRouterForStore = Router({ mergeParams: true });
storeInspectionsRouterForStore.get("/", storeInspectionsController.list);
storeInspectionsRouterForStore.patch("/:id", storeInspectionsController.update);
storeInspectionsRouterForStore.post(
  "/",
  upload.fields([
    { name: "photosBefore", maxCount: 5 },
    { name: "photosAfter", maxCount: 5 },
  ]),
  storeInspectionsController.create
);
