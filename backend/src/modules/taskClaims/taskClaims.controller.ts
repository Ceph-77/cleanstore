import type { Request, Response } from "express";
import type { ClaimStatus } from "@prisma/client";
import { claimDecisionSchema } from "./taskClaims.schema";
import * as taskClaimsService from "./taskClaims.service";

export async function listMarketplace(req: Request, res: Response) {
  const tasks = await taskClaimsService.listMarketplaceTasks();
  res.json({ tasks });
}

export async function create(req: Request, res: Response) {
  const claim = await taskClaimsService.createClaim(req.params.taskId, req.session.userId!);
  res.status(201).json({ claim });
}

export async function listMine(req: Request, res: Response) {
  const claims = await taskClaimsService.listMyClaims(req.session.userId!);
  res.json({ claims });
}

export async function list(req: Request, res: Response) {
  const status = req.query.status as ClaimStatus | undefined;
  const claims = await taskClaimsService.listClaims(status);
  res.json({ claims });
}

export async function decide(req: Request, res: Response) {
  const parsed = claimDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const claim = await taskClaimsService.decideClaim(req.params.id, parsed.data.status);
  res.json({ claim });
}
