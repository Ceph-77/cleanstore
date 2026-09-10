import { Router } from "express";
import { requireConsole } from "../auth/auth.middleware";
import * as consoleController from "./console.controller";

/** Endpoints transverses de la Console de gestion — tout rôle ayant un accès console. */
export const consoleRouter = Router();
consoleRouter.use(requireConsole);
consoleRouter.get("/alerts", consoleController.alerts);
