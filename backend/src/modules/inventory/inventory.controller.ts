import type { Request, Response } from "express";
import { inventoryItemCreateSchema, inventoryItemUpdateSchema, restockSchema } from "./inventory.schema";
import * as inventory from "./inventory.service";
import { logAudit } from "../audit/audit.service";

export async function list(req: Request, res: Response) {
  res.json({ items: await inventory.listForStore(req.params.storeId, req.query.all === "1") });
}

export async function create(req: Request, res: Response) {
  const parsed = inventoryItemCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await inventory.createItem(req.params.storeId, parsed.data);
  logAudit(req.session.userId, {
    action: "create",
    section: "inventory",
    entityType: "StoreInventoryItem",
    entityId: item.id,
    summary: `Article ajouté — ${item.name}`,
  });
  res.status(201).json({ item });
}

export async function update(req: Request, res: Response) {
  const parsed = inventoryItemUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { quantity: _ignored, ...rest } = parsed.data;
  const item = await inventory.updateItem(req.params.id, rest);
  res.json({ item });
}

export async function remove(req: Request, res: Response) {
  const item = await inventory.deactivateItem(req.params.id);
  logAudit(req.session.userId, {
    action: "delete",
    section: "inventory",
    entityType: "StoreInventoryItem",
    entityId: item.id,
    summary: `Article désactivé — ${item.name}`,
  });
  res.json({ item });
}

export async function restock(req: Request, res: Response) {
  const parsed = restockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const item = await inventory.adjustQuantity(
      req.params.id,
      parsed.data.qty,
      req.session.userId ?? null,
      parsed.data.reason,
    );
    logAudit(req.session.userId, {
      action: "update",
      section: "inventory",
      entityType: "StoreInventoryItem",
      entityId: item.id,
      summary: `${parsed.data.qty >= 0 ? "Réappro" : "Correction"} — ${item.name} (${parsed.data.qty >= 0 ? "+" : ""}${parsed.data.qty})`,
    });
    res.json({ item });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function movements(req: Request, res: Response) {
  res.json({ movements: await inventory.listMovements(req.params.id) });
}

export async function alerts(_req: Request, res: Response) {
  res.json(await inventory.alertCounts());
}

export async function alertItems(_req: Request, res: Response) {
  res.json(await inventory.alertItems());
}
