import type { Request, Response } from "express";
import * as engagementService from "./engagement.service";

export async function mySummary(req: Request, res: Response) {
  const summary = await engagementService.getMySummary(req.session.userId!);
  res.json({ summary });
}

export async function unseenMoments(req: Request, res: Response) {
  const moments = await engagementService.listUnseenMoments(req.session.userId!);
  res.json({ moments });
}

export async function markMomentSeen(req: Request, res: Response) {
  await engagementService.markMomentSeen(req.session.userId!, req.params.id);
  res.status(204).send();
}

export async function markAllSeen(req: Request, res: Response) {
  await engagementService.markAllMomentsSeen(req.session.userId!);
  res.status(204).send();
}

export async function leaderboard(_req: Request, res: Response) {
  const rows = await engagementService.getLeaderboard();
  res.json({ rows });
}
