import type { Request, Response } from "express";
import type { ClaimStatus } from "@prisma/client";
import { pageParamsSchema } from "../../utils/pagination";
import { claimDecisionSchema, createClaimSchema, directAssignSchema } from "./taskClaims.schema";
import * as taskClaimsService from "./taskClaims.service";
import { recordServerEvent } from "../analytics/analytics.service";

export async function listMarketplace(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const { items, nextCursor } = await taskClaimsService.listMarketplaceTasksWithUrls(page.data);
  res.json({ tasks: items, nextCursor });
}

export async function create(req: Request, res: Response) {
  const parsed = createClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const claim = await taskClaimsService.createClaim(req.params.taskId, req.session.userId!, parsed.data.note);
    void recordServerEvent("task_claim_submitted", {
      userId: req.session.userId,
      role: req.session.roleKey ?? null,
      props: { taskId: req.params.taskId },
    }).catch(() => {});
    res.status(201).json({ claim });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listMine(req: Request, res: Response) {
  const claims = await taskClaimsService.listMyClaims(req.session.userId!);
  res.json({ claims });
}

export async function assignableWorkers(_req: Request, res: Response) {
  const workers = await taskClaimsService.listAssignableWorkers();
  res.json({ workers });
}

export async function directAssign(req: Request, res: Response) {
  const parsed = directAssignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const task = await taskClaimsService.directAssignTask(
      parsed.data.taskId,
      parsed.data.workerId,
      req.session.userId!
    );
    void recordServerEvent("task_direct_assigned", {
      userId: parsed.data.workerId,
      role: "travailleur",
      props: { taskId: parsed.data.taskId },
    }).catch(() => {});
    res.json({ task });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function list(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const status = req.query.status as ClaimStatus | undefined;
  const { items, nextCursor } = await taskClaimsService.listClaims(page.data, status);
  res.json({ claims: items, nextCursor });
}

export async function decide(req: Request, res: Response) {
  const parsed = claimDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const claim = await taskClaimsService.decideClaim(req.params.id, parsed.data.status, parsed.data.reason);
  void recordServerEvent(
    parsed.data.status === "approved" ? "task_claim_approved" : "task_claim_rejected",
    { userId: claim.workerId, role: "travailleur", props: { taskId: claim.taskId } }
  ).catch(() => {});
  res.json({ claim });
}
