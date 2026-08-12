import { Router } from "express";
import * as tasksController from "./tasks.controller";

export const tasksRouterForStore = Router({ mergeParams: true });
tasksRouterForStore.get("/", tasksController.list);
tasksRouterForStore.post("/", tasksController.create);

export const tasksRouter = Router();
tasksRouter.patch("/:id", tasksController.update);
tasksRouter.delete("/:id", tasksController.remove);
