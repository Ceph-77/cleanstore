import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { sessionRoles } from "../auth/auth.middleware";
import { can } from "../auth/permissions";
import { buildMonthlyStatement, buildWithdrawalReceipt } from "./documents.service";

const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export async function withdrawalReceipt(req: Request, res: Response) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: req.params.id },
    select: { workerId: true },
  });
  if (!withdrawal) return res.status(404).json({ error: "Retrait introuvable." });
  const isOwner = withdrawal.workerId === req.session.userId;
  if (!isOwner && !can(sessionRoles(req), "finance", "view")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const pdf = await buildWithdrawalReceipt(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recu-retrait-${req.params.id.slice(0, 8)}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function monthlyStatement(req: Request, res: Response) {
  const parsed = monthQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const workerId = req.params.id;
  const isOwner = workerId === req.session.userId;
  if (!isOwner && !can(sessionRoles(req), "finance", "view")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const pdf = await buildMonthlyStatement(workerId, parsed.data.year, parsed.data.month);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="releve-${parsed.data.year}-${String(parsed.data.month).padStart(2, "0")}.pdf"`,
    );
    res.send(pdf);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
