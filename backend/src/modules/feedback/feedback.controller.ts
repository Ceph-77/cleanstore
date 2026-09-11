import type { Request, Response } from "express";
import { convertToIncidentSchema, feedbackCreateSchema, feedbackUpdateSchema } from "./feedback.schema";
import * as feedbackService from "./feedback.service";
import { logAudit } from "../audit/audit.service";

export async function list(_req: Request, res: Response) {
  const entries = await feedbackService.listFeedback();
  res.json({ entries });
}

export async function create(req: Request, res: Response) {
  const parsed = feedbackCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const entry = await feedbackService.createFeedback(
    parsed.data,
    req.session.userId!,
    req.session.roleKey ?? null
  );
  res.status(201).json({ entry });
}

export async function update(req: Request, res: Response) {
  const parsed = feedbackUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const entry = await feedbackService.updateFeedback(req.params.id, parsed.data);
  res.json({ entry });
}

export async function convertToIncident(req: Request, res: Response) {
  const parsed = convertToIncidentSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const entry = await feedbackService.convertToIncident(req.params.id, parsed.data.type, parsed.data.severity);
    logAudit(req.session.userId, {
      action: "update",
      section: "feedback",
      entityType: "Feedback",
      entityId: entry.id,
      summary: "Feedback converti en incident",
    });
    res.json({ entry });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function remove(req: Request, res: Response) {
  await feedbackService.deleteFeedback(req.params.id);
  res.status(204).send();
}
