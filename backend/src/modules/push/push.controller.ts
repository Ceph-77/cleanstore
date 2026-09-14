import type { Request, Response } from "express";
import * as pushService from "./push.service";
import { subscribeSchema, unsubscribeSchema } from "./push.schema";

export function vapidPublicKey(_req: Request, res: Response) {
  res.json({ publicKey: pushService.getVapidPublicKey() });
}

export async function subscribe(req: Request, res: Response) {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  await pushService.saveSubscription(req.session.userId!, parsed.data, req.headers["user-agent"]);
  res.status(204).send();
}

export async function unsubscribe(req: Request, res: Response) {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  await pushService.removeSubscription(req.session.userId!, parsed.data.endpoint);
  res.status(204).send();
}
