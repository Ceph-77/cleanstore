import { Router } from "express";
import { requireCan } from "../auth/auth.middleware";
import * as controller from "./contributions.controller";

/** Soumettre est ouvert à tout user connecté (Q57 : "n'importe qui soumet"). */
export const contributionsRouter = Router();
contributionsRouter.post("/", controller.create);
contributionsRouter.get("/registry", controller.registry);
contributionsRouter.get("/", requireCan("rewards", "manage"), controller.list);
contributionsRouter.patch("/:id", requireCan("rewards", "manage"), controller.decide);
