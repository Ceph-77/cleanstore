import type { Request, Response } from "express";
import { pageParamsSchema } from "../../utils/pagination";
import { storeCreateSchema, storeUpdateSchema, storeGeofenceSchema } from "./stores.schema";
import * as storesService from "./stores.service";
import { recordServerEvent } from "../analytics/analytics.service";
import { logAudit } from "../audit/audit.service";
import { recurrencePauseSchema } from "../tasks/tasks.schema";
import { setStoreRecurrencePaused } from "../tasks/tasks.service";

export async function list(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const { items, nextCursor } = await storesService.listStores(page.data);
  res.json({ stores: items, nextCursor });
}

export async function listMapPoints(req: Request, res: Response) {
  const stores = await storesService.listStoresWithCoordinates();
  res.json({ stores });
}

export async function listOptions(req: Request, res: Response) {
  const stores = await storesService.listStoreOptions();
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
  void recordServerEvent("store_created", {
    userId: req.session.userId,
    role: req.session.roleKey ?? null,
    props: { storeId: store.id },
  }).catch(() => {});
  logAudit(req.session.userId, {
    action: "create",
    section: "stores",
    entityType: "Store",
    entityId: store.id,
    summary: `Magasin créé — ${store.name}`,
  });
  res.status(201).json({ store });
}

export async function update(req: Request, res: Response) {
  const parsed = storeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const store = await storesService.updateStore(req.params.id, parsed.data);
  logAudit(req.session.userId, {
    action: "update",
    section: "stores",
    entityType: "Store",
    entityId: store.id,
    summary: `Magasin modifié — ${store.name}`,
  });
  res.json({ store });
}

export async function setGeofence(req: Request, res: Response) {
  const parsed = storeGeofenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const store = await storesService.setStoreGeofence(req.params.id, parsed.data);
  res.json({ store });
}

export async function setRecurrencePause(req: Request, res: Response) {
  const parsed = recurrencePauseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const store = await setStoreRecurrencePaused(req.params.id, parsed.data.paused);
  logAudit(req.session.userId, {
    action: "update",
    section: "stores",
    entityType: "Store",
    entityId: store.id,
    summary: parsed.data.paused
      ? `Récurrence du magasin mise en pause — ${store.name}`
      : `Récurrence du magasin réactivée — ${store.name}`,
  });
  res.json({ store });
}

export async function archive(req: Request, res: Response) {
  const store = await storesService.archiveStore(req.params.id);
  logAudit(req.session.userId, {
    action: "update",
    section: "stores",
    entityType: "Store",
    entityId: store.id,
    summary: `Magasin archivé — ${store.name}`,
  });
  res.json({ store });
}
