import type { Request, Response } from "express";
import { env } from "../../config/env";
import * as tasksService from "../tasks/tasks.service";

export async function triggerRecurrence(req: Request, res: Response) {
  if (!env.CRON_SECRET) {
    return res.status(503).json({ error: "Recurrence is not configured (missing CRON_SECRET)" });
  }

  const provided = (req.headers["x-cron-secret"] as string | undefined) ?? (req.query.secret as string | undefined);
  if (provided !== env.CRON_SECRET) {
    return res.status(401).json({ error: "Invalid or missing secret" });
  }

  const created = await tasksService.runDueRecurrences();
  res.json({ created });
}
