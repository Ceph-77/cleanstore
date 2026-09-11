import { Router } from "express";
import { requireRole, requireCan } from "../auth/auth.middleware";
import * as controller from "./clanShares.controller";

export const clanSharesRouter = Router();
clanSharesRouter.post("/tasks/:taskId", requireRole("travailleur"), controller.create);
clanSharesRouter.get("/tasks/:taskId", requireRole("travailleur"), controller.listForTask);
clanSharesRouter.get("/mine", requireRole("travailleur"), controller.listMine);
clanSharesRouter.get("/claimable", requireRole("travailleur"), controller.claimable);
clanSharesRouter.get("/", requireCan("markettask", "manage"), controller.listAll);
clanSharesRouter.patch("/:id/decide", requireRole("travailleur"), controller.decide);
clanSharesRouter.post("/:id/inspector-award", requireCan("markettask", "manage"), controller.inspectorAward);
