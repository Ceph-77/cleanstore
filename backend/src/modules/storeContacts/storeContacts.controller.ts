import type { Request, Response } from "express";
import { storeContactCreateSchema, storeContactUpdateSchema } from "./storeContacts.schema";
import * as storeContactsService from "./storeContacts.service";

export async function list(req: Request, res: Response) {
  const contacts = await storeContactsService.listContacts(req.params.storeId);
  res.json({ contacts });
}

export async function create(req: Request, res: Response) {
  const parsed = storeContactCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const contact = await storeContactsService.createContact(req.params.storeId, parsed.data);
  res.status(201).json({ contact });
}

export async function update(req: Request, res: Response) {
  const parsed = storeContactUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const contact = await storeContactsService.updateContact(req.params.id, parsed.data);
  res.json({ contact });
}

export async function remove(req: Request, res: Response) {
  await storeContactsService.deleteContact(req.params.id);
  res.status(204).send();
}
