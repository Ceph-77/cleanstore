import type { Request, Response } from "express";
import { env } from "../../config/env";
import * as tasksService from "../tasks/tasks.service";
import * as paymentsService from "../payments/payments.service";

function checkSecret(req: Request, res: Response): boolean {
  if (!env.CRON_SECRET) {
    res.status(503).json({ error: "This route is not configured (missing CRON_SECRET)" });
    return false;
  }
  const provided = (req.headers["x-cron-secret"] as string | undefined) ?? (req.query.secret as string | undefined);
  if (provided !== env.CRON_SECRET) {
    res.status(401).json({ error: "Invalid or missing secret" });
    return false;
  }
  return true;
}

export async function triggerRecurrence(req: Request, res: Response) {
  if (!checkSecret(req, res)) return;
  const created = await tasksService.runDueRecurrences();
  res.json({ created });
}

export async function triggerPayoutSweep(req: Request, res: Response) {
  if (!checkSecret(req, res)) return;
  const processed = await paymentsService.runDuePayouts();
  res.json({ processed });
}
