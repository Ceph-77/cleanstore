import type { Request, Response } from "express";
import { ledgerListQuerySchema } from "./ledger.schema";
import * as ledger from "./ledger.service";

export async function list(req: Request, res: Response) {
  const parsed = ledgerListQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json(await ledger.listLedger(parsed.data));
}

export async function summary(_req: Request, res: Response) {
  res.json(await ledger.ledgerSummary());
}

export async function exportCsv(req: Request, res: Response) {
  const parsed = ledgerListQuerySchema.safeParse({ ...req.query, limit: 1000 });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { items } = await ledger.listLedger(parsed.data);
  const csv = ledger.toCsv(
    items.map((r) => ({
      date: r.createdAt.toISOString(),
      type: r.type,
      montant: r.amount.toString(),
      devise: r.currency,
      partie_a: r.partyAName ?? r.partyAId ?? "",
      partie_b: r.partyBName ?? r.partyBId ?? "",
      tache: r.task?.description ?? "",
      motif: r.reason ?? "",
      statut: r.status,
    })),
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="grand-livre.csv"');
  res.send(csv);
}
