import type { Request, Response } from "express";
import { feedbackCreateSchema } from "./feedback.schema";
import * as feedbackService from "./feedback.service";

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

export async function remove(req: Request, res: Response) {
  await feedbackService.deleteFeedback(req.params.id);
  res.status(204).send();
}
