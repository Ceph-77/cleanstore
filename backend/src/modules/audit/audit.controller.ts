import type { Request, Response } from "express";
import { auditListQuerySchema } from "./audit.schema";
import * as auditService from "./audit.service";

export async function list(req: Request, res: Response) {
  const parsed = auditListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const page = await auditService.listAudit(parsed.data);
  res.json(page);
}
