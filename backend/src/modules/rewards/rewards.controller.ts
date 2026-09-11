import type { Request, Response } from "express";
import { computeRewardMetrics, computeBadges, badgeLabel } from "./rewards.service";

function serialize(metrics: Awaited<ReturnType<typeof computeRewardMetrics>>) {
  const badges = computeBadges(metrics);
  return { metrics, badges: badges.map((key) => ({ key, label: badgeLabel(key) })) };
}

export async function me(req: Request, res: Response) {
  const metrics = await computeRewardMetrics(req.session.userId!);
  res.json(serialize(metrics));
}

export async function forWorker(req: Request, res: Response) {
  const metrics = await computeRewardMetrics(req.params.id);
  res.json(serialize(metrics));
}
