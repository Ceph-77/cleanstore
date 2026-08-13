import type { Request, Response } from "express";
import { storeInvoiceCreateSchema, storeInvoiceUpdateSchema } from "./storeInvoices.schema";
import * as storeInvoicesService from "./storeInvoices.service";

export async function list(req: Request, res: Response) {
  const invoices = await storeInvoicesService.listInvoices(req.params.storeId);
  res.json({ invoices });
}

export async function create(req: Request, res: Response) {
  const parsed = storeInvoiceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const invoice = await storeInvoicesService.createInvoice(req.params.storeId, parsed.data, req.session.userId!);
  res.status(201).json({ invoice });
}

export async function update(req: Request, res: Response) {
  const parsed = storeInvoiceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const invoice = await storeInvoicesService.updateInvoice(req.params.id, parsed.data);
  res.json({ invoice });
}

export async function remove(req: Request, res: Response) {
  await storeInvoicesService.deleteInvoice(req.params.id);
  res.status(204).send();
}
