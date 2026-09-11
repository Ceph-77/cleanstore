import type { Request, Response } from "express";
import type { NegotiationStatus } from "@prisma/client";
import { pageParamsSchema } from "../../utils/pagination";
import {
  acceptNegotiationSchema,
  counterOfferSchema,
  openNegotiationSchema,
  rejectNegotiationSchema,
} from "./negotiations.schema";
import * as service from "./negotiations.service";
import { logAudit } from "../audit/audit.service";

export async function open(req: Request, res: Response) {
  const parsed = openNegotiationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const negotiation = await service.openNegotiation(
      req.params.taskId,
      req.session.userId!,
      parsed.data.amount,
      parsed.data.note,
      parsed.data.clanId,
    );
    res.status(201).json({ negotiation });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function workerCounter(req: Request, res: Response) {
  const parsed = counterOfferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const negotiation = await service.addWorkerOffer(
      req.params.id,
      req.session.userId!,
      parsed.data.amount,
      parsed.data.note,
    );
    res.json({ negotiation });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listMine(req: Request, res: Response) {
  const negotiations = await service.listMyNegotiations(req.session.userId!);
  res.json({ negotiations });
}

export async function list(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const status = req.query.status as NegotiationStatus | undefined;
  const { items, nextCursor } = await service.listNegotiations(page.data, status);
  res.json({ negotiations: items, nextCursor });
}

export async function adminCounter(req: Request, res: Response) {
  const parsed = counterOfferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const negotiation = await service.addAdminOffer(
      req.params.id,
      req.session.userId!,
      parsed.data.amount,
      parsed.data.note,
    );
    res.json({ negotiation });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function accept(req: Request, res: Response) {
  const parsed = acceptNegotiationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const negotiation = await service.acceptNegotiation(req.params.id, parsed.data.amount, parsed.data.note);
    logAudit(req.session.userId, {
      action: "decision",
      section: "markettask",
      entityType: "TaskNegotiation",
      entityId: negotiation.id,
      summary: `Négociation acceptée — tâche « ${negotiation.task.description} » à ${Number(negotiation.task.price)} $`,
    });
    res.json({ negotiation });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function reject(req: Request, res: Response) {
  const parsed = rejectNegotiationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const negotiation = await service.rejectNegotiation(req.params.id, parsed.data.reason);
    logAudit(req.session.userId, {
      action: "decision",
      section: "markettask",
      entityType: "TaskNegotiation",
      entityId: negotiation.id,
      summary: `Négociation refusée — tâche « ${negotiation.task.description} »`,
    });
    res.json({ negotiation });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
