import { Router } from "express";
import multer from "multer";
import * as taskInspectionsController from "./taskInspections.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const taskInspectionsRouterForTask = Router({ mergeParams: true });
taskInspectionsRouterForTask.get("/", taskInspectionsController.get);
taskInspectionsRouterForTask.post(
  "/",
  upload.fields([
    { name: "photosBefore", maxCount: 5 },
    { name: "photosAfter", maxCount: 5 },
  ]),
  taskInspectionsController.create
);
