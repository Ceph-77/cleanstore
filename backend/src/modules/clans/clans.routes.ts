import { Router } from "express";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./clans.controller";

/** Espace clans — travailleurs autonomes (admin peut aussi consulter/agir). */
export const clansRouter = Router();
clansRouter.use(requireRole("travailleur", "admin"));

clansRouter.get("/mine", controller.listMine);
clansRouter.post("/", controller.create);
clansRouter.post("/join", controller.join);
clansRouter.get("/invites", controller.listInvites);
clansRouter.post("/invites/:inviteId/accept", controller.acceptInvite);
clansRouter.post("/:id/invite", controller.invite);
clansRouter.post("/:id/leave", controller.leave);
clansRouter.delete("/:id/members/:userId", controller.removeMember);
