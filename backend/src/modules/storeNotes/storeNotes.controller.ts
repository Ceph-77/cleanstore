import type { Request, Response } from "express";
import { storeNoteCreateSchema, storeNoteUpdateSchema } from "./storeNotes.schema";
import * as storeNotesService from "./storeNotes.service";

export async function list(req: Request, res: Response) {
  const notes = await storeNotesService.listNotes(req.params.storeId);
  res.json({ notes });
}

export async function create(req: Request, res: Response) {
  const parsed = storeNoteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const note = await storeNotesService.createNote(req.params.storeId, parsed.data, req.session.userId!);
  res.status(201).json({ note });
}

export async function update(req: Request, res: Response) {
  const parsed = storeNoteUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const note = await storeNotesService.updateNote(req.params.id, parsed.data);
  res.json({ note });
}

export async function remove(req: Request, res: Response) {
  await storeNotesService.deleteNote(req.params.id);
  res.status(204).send();
}
