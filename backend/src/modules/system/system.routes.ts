import { Router } from "express";
import * as systemController from "./system.controller";

export const systemRouter = Router();
systemRouter.post("/recurrence", systemController.triggerRecurrence);
systemRouter.post("/payout-sweep", systemController.triggerPayoutSweep);
