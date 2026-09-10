import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./taskTemplates.controller";

export const taskTemplatesRouter = Router();

taskTemplatesRouter.use(requireRole("admin"));
taskTemplatesRouter.get("/", controller.list);
taskTemplatesRouter.post("/", controller.create);
taskTemplatesRouter.post("/instantiate", controller.instantiate);
taskTemplatesRouter.get("/:id", controller.getOne);
taskTemplatesRouter.patch("/:id", controller.update);
taskTemplatesRouter.post("/:id/duplicate", controller.duplicate);
taskTemplatesRouter.delete("/:id", controller.remove);
