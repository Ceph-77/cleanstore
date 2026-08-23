import type { Request, Response } from "express";
import type { ClaimStatus } from "@prisma/client";
import { claimDecisionSchema, createClaimSchema } from "./storeClaims.schema";
import * as storeClaimsService from "./storeClaims.service";

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
  const status = req.query.status as ClaimStatus | undefined;
  const claims = await storeClaimsService.listClaims(status);
  res.json({ claims });
}

export async function decide(req: Request, res: Response) {
  const parsed = claimDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const claim = await storeClaimsService.decideClaim(req.params.id, parsed.data.status, parsed.data.reason);
  res.json({ claim });
}
