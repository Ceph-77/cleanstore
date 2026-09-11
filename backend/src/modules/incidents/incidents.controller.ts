import type { Request, Response } from "express";
import type { IncidentSeverity, IncidentStatus } from "@prisma/client";
import { pageParamsSchema } from "../../utils/pagination";
import { addIncidentNoteSchema, createIncidentSchema, updateIncidentSchema } from "./incidents.schema";
import * as service from "./incidents.service";
import { logAudit } from "../audit/audit.service";

export async function create(req: Request, res: Response) {
  const parsed = createIncidentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const incident = await service.createIncident(parsed.data, req.session.userId!);
  logAudit(req.session.userId, {
    action: "create",
    section: "feedback",
    entityType: "Incident",
    entityId: incident.id,
    summary: `Incident signalé — ${incident.type} (${incident.severity})`,
  });
  res.status(201).json({ incident });
}

export async function list(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const status = req.query.status as IncidentStatus | undefined;
  const severity = req.query.severity as IncidentSeverity | undefined;
  const { items, nextCursor } = await service.listIncidents(page.data, status, severity);
  res.json({ incidents: items, nextCursor });
}

export async function get(req: Request, res: Response) {
  const incident = await service.getIncident(req.params.id);
  if (!incident) return res.status(404).json({ error: "Incident introuvable." });
  res.json({ incident });
}

export async function update(req: Request, res: Response) {
  const parsed = updateIncidentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const incident = await service.updateIncident(req.params.id, parsed.data);
  logAudit(req.session.userId, {
    action: "update",
    section: "feedback",
    entityType: "Incident",
    entityId: incident.id,
    summary: `Incident mis à jour — statut ${incident.status}`,
  });
  res.json({ incident });
}

export async function addNote(req: Request, res: Response) {
  const parsed = addIncidentNoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const incident = await service.addNote(req.params.id, req.session.userId ?? null, parsed.data.body);
  res.json({ incident });
}
