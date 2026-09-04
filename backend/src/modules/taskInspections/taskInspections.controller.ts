import type { Request, Response } from "express";
import { taskInspectionCreateSchema, taskInspectionUpdateSchema } from "./taskInspections.schema";
import * as taskInspectionsService from "./taskInspections.service";

export async function get(req: Request, res: Response) {
  const inspection = await taskInspectionsService.getInspectionWithUrls(req.params.id);
  res.json({ inspection });
}

export async function update(req: Request, res: Response) {
  const parsed = taskInspectionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const inspection = await taskInspectionsService.updateInspection(req.params.id, parsed.data);
    res.json({ inspection });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function create(req: Request, res: Response) {
  const parsed = taskInspectionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const files = req.files as
    | { photosBefore?: Express.Multer.File[]; photosAfter?: Express.Multer.File[] }
    | undefined;

  try {
    const inspection = await taskInspectionsService.createInspection(
      req.params.id,
      parsed.data,
      { before: files?.photosBefore ?? [], after: files?.photosAfter ?? [] },
      req.session.userId!
    );
    res.status(201).json({ inspection });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
