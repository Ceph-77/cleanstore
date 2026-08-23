import type { Request, Response } from "express";
import * as notificationsService from "./notifications.service";

export async function unseenCount(req: Request, res: Response) {
  const count = await notificationsService.getUnseenDecisionsCount(req.session.userId!);
  res.json({ count });
}

export async function markSeen(req: Request, res: Response) {
  await notificationsService.markDecisionsSeen(req.session.userId!);
  res.status(204).send();
}
