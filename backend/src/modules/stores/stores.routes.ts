import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as storesController from "./stores.controller";
import { tasksRouterForStore } from "../tasks/tasks.routes";

export const storesRouter = Router();

storesRouter.use(requireRole("admin"));

storesRouter.get("/", storesController.list);
storesRouter.post("/", storesController.create);
storesRouter.get("/:id", storesController.getOne);
storesRouter.patch("/:id", storesController.update);
storesRouter.patch("/:id/archive", storesController.archive);

storesRouter.use("/:storeId/tasks", tasksRouterForStore);
