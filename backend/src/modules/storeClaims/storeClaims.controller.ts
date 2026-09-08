import type { Request, Response } from "express";
import type { ClaimStatus } from "@prisma/client";
import { pageParamsSchema } from "../../utils/pagination";
import { claimDecisionSchema, createClaimSchema } from "./storeClaims.schema";
import * as storeClaimsService from "./storeClaims.service";
import { recordServerEvent } from "../analytics/analytics.service";

export async function listAvailable(req: Request, res: Response) {
  const stores = await storeClaimsService.listAvailableStores();
  res.json({ stores });
}

export async function create(req: Request, res: Response) {
  const parsed = createClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const claim = await storeClaimsService.createClaim(req.params.storeId, req.session.userId!, parsed.data.note);
    void recordServerEvent("store_claim_submitted", {
      userId: req.session.userId,
      role: req.session.roleKey ?? null,
      props: { storeId: req.params.storeId },
    }).catch(() => {});
    res.status(201).json({ claim });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listMine(req: Request, res: Response) {
  const claims = await storeClaimsService.listMyClaims(req.session.userId!);
  res.json({ claims });
}

export async function list(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const status = req.query.status as ClaimStatus | undefined;
  const { items, nextCursor } = await storeClaimsService.listClaims(page.data, status);
  res.json({ claims: items, nextCursor });
}

export async function decide(req: Request, res: Response) {
  const parsed = claimDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const claim = await storeClaimsService.decideClaim(req.params.id, parsed.data.status, parsed.data.reason);
  void recordServerEvent(
    parsed.data.status === "approved" ? "store_claim_approved" : "store_claim_rejected",
    { userId: claim.requestedById, role: "sous_traitant", props: { storeId: claim.storeId } }
  ).catch(() => {});
  res.json({ claim });
}
