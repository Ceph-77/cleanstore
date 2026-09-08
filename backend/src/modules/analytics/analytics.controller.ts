import type { Request, Response } from "express";
import { analyticsQuerySchema, trackBatchSchema } from "./analytics.schema";
import * as analyticsService from "./analytics.service";

export async function track(req: Request, res: Response) {
  const parsed = trackBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  await analyticsService.recordClientEvents(parsed.data.events, {
    userId: req.session.userId ?? null,
    role: req.session.roleKey ?? null,
  });
  res.status(202).json({ ok: true });
}

function parseDays(req: Request, res: Response): number | null {
  const parsed = analyticsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return null;
  }
  return parsed.data.days;
}

export async function overview(req: Request, res: Response) {
  const days = parseDays(req, res);
  if (days === null) return;
  const [counts, intentFunnel, deliveryFunnel] = await Promise.all([
    analyticsService.getOverview(days),
    analyticsService.getFunnel(analyticsService.WORKER_INTENT_FUNNEL, "sessionId", days),
    analyticsService.getFunnel(analyticsService.WORKER_DELIVERY_FUNNEL, "userId", days),
  ]);
  res.json({ days, counts, intentFunnel, deliveryFunnel });
}

export async function recent(req: Request, res: Response) {
  const days = parseDays(req, res);
  if (days === null) return;
  const events = await analyticsService.listRecentEvents(days);
  res.json({ events });
}

export async function exportCsv(req: Request, res: Response) {
  const days = parseDays(req, res);
  if (days === null) return;
  const csv = await analyticsService.exportCsv(days);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="analytics-${days}j.csv"`);
  res.send(csv);
}
