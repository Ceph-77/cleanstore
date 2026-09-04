import type { Request, Response } from "express";
import { pastTaskSchema, pastTaskUpdateSchema } from "./engagement.schema";
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

export async function streakStrip(req: Request, res: Response) {
  const strip = await engagementService.getStreakStrip(req.session.userId!);
  res.json(strip);
}

export async function dayTasks(req: Request, res: Response) {
  try {
    const result = await engagementService.getTasksForDay(req.session.userId!, req.params.date);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function leaderboard(_req: Request, res: Response) {
  const rows = await engagementService.getLeaderboard();
  res.json({ rows });
}

// ── Admin: inspect any worker + record past work ──

export async function workerSummary(req: Request, res: Response) {
  res.json({ summary: await engagementService.getMySummary(req.params.workerId) });
}

export async function workerStreak(req: Request, res: Response) {
  res.json(await engagementService.getStreakStrip(req.params.workerId));
}

export async function workerDayTasks(req: Request, res: Response) {
  try {
    res.json(await engagementService.getTasksForDay(req.params.workerId, req.params.date));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function addPastTask(req: Request, res: Response) {
  const parsed = pastTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const result = await engagementService.backfillCompletedTask(
      { workerId: req.params.workerId, ...parsed.data },
      req.session.userId!
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function updatePastTask(req: Request, res: Response) {
  const parsed = pastTaskUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    res.json(
      await engagementService.updatePastTask(req.params.workerId, req.params.taskId, parsed.data)
    );
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function deletePastTask(req: Request, res: Response) {
  try {
    res.json(await engagementService.deletePastTask(req.params.workerId, req.params.taskId));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
