import type { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { createShareClaimSchema, decideShareClaimSchema, inspectorAwardSchema } from "./clanShares.schema";
import * as service from "./clanShares.service";
import { logAudit } from "../audit/audit.service";

export async function create(req: Request, res: Response) {
  const parsed = createShareClaimSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const claim = await service.createShareClaim(
      req.params.taskId,
      req.session.userId!,
      parsed.data.percent,
      parsed.data.note,
      parsed.data.completedStepIds,
    );
    res.status(201).json({ claim });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listForTask(req: Request, res: Response) {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId }, select: { assignedToId: true } });
  if (!task) return res.status(404).json({ error: "Tâche introuvable." });
  const userId = req.session.userId!;
  const claims = await service.listForTask(req.params.taskId);
  const involved = task.assignedToId === userId || claims.some((c) => c.claimantId === userId);
  if (!involved) return res.status(403).json({ error: "Forbidden" });
  res.json({ claims });
}

export async function listMine(req: Request, res: Response) {
  const claims = await service.listMine(req.session.userId!);
  res.json({ claims });
}

export async function listAll(_req: Request, res: Response) {
  const claims = await service.listAll();
  res.json({ claims });
}

export async function claimable(req: Request, res: Response) {
  const tasks = await service.listClaimableTasks(req.session.userId!);
  res.json({ tasks });
}

export async function decide(req: Request, res: Response) {
  const parsed = decideShareClaimSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const claim = await service.decideShareClaim(
      req.params.id,
      req.session.userId!,
      parsed.data.decision,
      parsed.data.decisionNote,
    );
    res.json({ claim });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function inspectorAward(req: Request, res: Response) {
  const parsed = inspectorAwardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const claim = await service.inspectorAward(
      req.params.id,
      req.session.userId!,
      parsed.data.percent,
      parsed.data.decisionNote,
    );
    logAudit(req.session.userId, {
      action: "decision",
      section: "markettask",
      entityType: "ClanShareClaim",
      entityId: claim.id,
      summary: `Part de clan attribuée par un inspecteur — ${parsed.data.percent}%`,
    });
    res.json({ claim });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
