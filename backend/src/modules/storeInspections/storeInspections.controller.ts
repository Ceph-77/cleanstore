import type { Request, Response } from "express";
import { storeInspectionCreateSchema, storeInspectionUpdateSchema } from "./storeInspections.schema";
import * as storeInspectionsService from "./storeInspections.service";

export async function list(req: Request, res: Response) {
  const inspections = await storeInspectionsService.listInspectionsWithUrls(req.params.storeId);
  res.json({ inspections });
}

export async function update(req: Request, res: Response) {
  const parsed = storeInspectionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const inspection = await storeInspectionsService.updateInspection(req.params.id, parsed.data);
    res.json({ inspection });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function create(req: Request, res: Response) {
  let checklist: unknown = [];
  if (typeof req.body.checklist === "string") {
    try {
      checklist = JSON.parse(req.body.checklist);
    } catch {
      return res.status(400).json({ error: "Invalid checklist format" });
    }
  }

  const parsed = storeInspectionCreateSchema.safeParse({ ...req.body, checklist });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const files = req.files as
    | { photosBefore?: Express.Multer.File[]; photosAfter?: Express.Multer.File[] }
    | undefined;

  const inspection = await storeInspectionsService.createInspection(
    req.params.storeId,
    parsed.data,
    { before: files?.photosBefore ?? [], after: files?.photosAfter ?? [] },
    req.session.userId!
  );
  res.status(201).json({ inspection });
}
