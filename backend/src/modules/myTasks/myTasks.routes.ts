import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as myTasksController from "./myTasks.controller";

export const myTasksRouter = Router();
myTasksRouter.get("/my-tasks", requireRole("travailleur"), myTasksController.list);
myTasksRouter.patch("/my-tasks/:id/status", requireRole("travailleur"), myTasksController.updateStatus);
myTasksRouter.get("/my-tasks/:id/inspection", requireRole("travailleur"), myTasksController.getInspection);
