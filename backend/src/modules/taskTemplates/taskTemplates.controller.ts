import type { Request, Response } from "express";
import {
  instantiateSchema,
  templateCreateSchema,
  templateUpdateSchema,
} from "./taskTemplates.schema";
import { logAudit } from "../audit/audit.service";
import * as service from "./taskTemplates.service";

export async function list(req: Request, res: Response) {
  const includeInactive = req.query.all === "1" || req.query.all === "true";
  const templates = await service.listTemplates(includeInactive);
  res.json({ templates });
}

export async function getOne(req: Request, res: Response) {
  const template = await service.getTemplate(req.params.id);
  if (!template) return res.status(404).json({ error: "Modèle introuvable." });
  res.json({ template });
}

export async function create(req: Request, res: Response) {
  const parsed = templateCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const template = await service.createTemplate(parsed.data);
    logAudit(req.session.userId, {
      action: "create",
      section: "task_templates",
      entityType: "TaskTemplate",
      entityId: template.id,
      summary: `Modèle créé — ${template.name}`,
    });
    res.status(201).json({ template });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function update(req: Request, res: Response) {
  const parsed = templateUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const template = await service.updateTemplate(req.params.id, parsed.data);
    logAudit(req.session.userId, {
      action: "update",
      section: "task_templates",
      entityType: "TaskTemplate",
      entityId: template.id,
      summary: `Modèle modifié — ${template.name}`,
    });
    res.json({ template });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function remove(req: Request, res: Response) {
  await service.deactivateTemplate(req.params.id);
  logAudit(req.session.userId, {
    action: "delete",
    section: "task_templates",
    entityType: "TaskTemplate",
    entityId: req.params.id,
    summary: "Modèle de tâche désactivé",
  });
  res.status(204).send();
}

export async function duplicate(req: Request, res: Response) {
  try {
    const template = await service.duplicateTemplate(req.params.id);
    logAudit(req.session.userId, {
      action: "create",
      section: "task_templates",
      entityType: "TaskTemplate",
      entityId: template.id,
      summary: `Modèle dupliqué — ${template.name}`,
    });
    res.status(201).json({ template });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function instantiate(req: Request, res: Response) {
  const parsed = instantiateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const tasks = await service.instantiateMany(
      parsed.data.templateIds,
      parsed.data.storeId,
      req.session.userId!,
      parsed.data.variantByTemplate
    );
    res.status(201).json({ tasks });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
