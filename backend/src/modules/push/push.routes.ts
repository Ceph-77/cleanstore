import { Router } from "express";
import * as pushController from "./push.controller";

export const pushRouter = Router();
pushRouter.get("/vapid-public-key", pushController.vapidPublicKey);
pushRouter.post("/subscribe", pushController.subscribe);
pushRouter.post("/unsubscribe", pushController.unsubscribe);
