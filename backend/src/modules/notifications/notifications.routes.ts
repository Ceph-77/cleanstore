import { Router } from "express";
import * as notificationsController from "./notifications.controller";

export const notificationsRouter = Router();
notificationsRouter.get("/unseen-count", notificationsController.unseenCount);
notificationsRouter.post("/mark-seen", notificationsController.markSeen);
