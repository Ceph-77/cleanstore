import { Router } from "express";
import { requireCan } from "../auth/auth.middleware";
import * as controller from "./rewards.controller";

export const rewardsRouter = Router();
rewardsRouter.get("/me", controller.me);
rewardsRouter.get("/workers/:id", requireCan("rewards", "view"), controller.forWorker);
