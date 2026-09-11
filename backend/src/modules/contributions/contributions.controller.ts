import type { Request, Response } from "express";
import type { ContributionStatus } from "@prisma/client";
import { createContributionSchema, decideContributionSchema } from "./contributions.schema";
import * as service from "./contributions.service";
import { logAudit } from "../audit/audit.service";

export async function create(req: Request, res: Response) {
  const parsed = createContributionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const contribution = await service.createContribution(parsed.data, req.session.userId!);
  res.status(201).json({ contribution });
}

export async function list(req: Request, res: Response) {
  const status = req.query.status as ContributionStatus | undefined;
  const contributions = await service.listContributions(status);
  res.json({ contributions });
}

export async function registry(_req: Request, res: Response) {
  const contributions = await service.listRegistry();
  res.json({ contributions });
}

export async function decide(req: Request, res: Response) {
  const parsed = decideContributionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const contribution = await service.decideContribution(req.params.id, parsed.data);
  logAudit(req.session.userId, {
    action: "decision",
    section: "rewards",
    entityType: "Contribution",
    entityId: contribution.id,
    summary: `Contribution ${contribution.status} — « ${contribution.title} »`,
  });
  res.json({ contribution });
}
