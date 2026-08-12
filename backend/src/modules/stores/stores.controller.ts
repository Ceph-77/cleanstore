import type { Request, Response } from "express";
import { storeCreateSchema, storeUpdateSchema } from "./stores.schema";
import * as storesService from "./stores.service";

export async function list(req: Request, res: Response) {
  const stores = await storesService.listStores();
  res.json({ stores });
}

export async function listMapPoints(req: Request, res: Response) {
  const stores = await storesService.listStoresWithCoordinates();
  res.json({ stores });
}

export async function getOne(req: Request, res: Response) {
  const store = await storesService.getStoreById(req.params.id);
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }
  res.json({ store });
}

export async function create(req: Request, res: Response) {
  const parsed = storeCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const store = await storesService.createStore(parsed.data, req.session.userId!);
  res.status(201).json({ store });
}

export async function update(req: Request, res: Response) {
  const parsed = storeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const store = await storesService.updateStore(req.params.id, parsed.data);
  res.json({ store });
}

export async function archive(req: Request, res: Response) {
  const store = await storesService.archiveStore(req.params.id);
  res.json({ store });
}
