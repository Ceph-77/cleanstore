import type { Request, Response } from "express";
import type { TaskStatus } from "@prisma/client";
import { pageParamsSchema } from "../../utils/pagination";
import {
  taskCreateSchema,
  taskUpdateSchema,
  recurrenceSkipSchema,
} from "./tasks.schema";
import * as tasksService from "./tasks.service";
import { recordServerEvent } from "../analytics/analytics.service";
import { logAudit } from "../audit/audit.service";

export async function list(req: Request, res: Response) {
  const tasks = await tasksService.listTasksForStore(req.params.storeId);
  res.json({ tasks });
}

export async function create(req: Request, res: Response) {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const task = await tasksService.createTask(req.params.storeId, parsed.data, req.session.userId!);
  res.status(201).json({ task });
}

export async function update(req: Request, res: Response) {
  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const task = await tasksService.updateTask(req.params.id, parsed.data);
  res.json({ task });
}

export async function publish(req: Request, res: Response) {
  const task = await tasksService.publishTask(req.params.id);
  void recordServerEvent("task_published", {
    userId: req.session.userId,
    role: req.session.roleKey ?? null,
    props: { taskId: task.id, storeId: task.storeId },
  }).catch(() => {});
  res.json({ task });
}

export async function unpublish(req: Request, res: Response) {
  const task = await tasksService.unpublishTask(req.params.id);
  res.json({ task });
}

export async function dashboard(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const status = req.query.status as TaskStatus | undefined;
  const { items, nextCursor } = await tasksService.listAllTasksForDashboard(page.data, status);
  res.json({ tasks: items, nextCursor });
}

export async function remove(req: Request, res: Response) {
  try {
    await tasksService.deleteTask(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
}

export async function listRecurrences(_req: Request, res: Response) {
  res.json({ recurrences: await tasksService.listRecurrences() });
}

export async function skipRecurrence(req: Request, res: Response) {
  const parsed = recurrenceSkipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const task = await tasksService.skipRecurrenceToday(req.params.id, parsed.data.skip);
    logAudit(req.session.userId, {
      action: "update",
      section: "task_templates",
      entityType: "Task",
      entityId: task.id,
      summary: parsed.data.skip
        ? `Récurrence sautée aujourd'hui — ${task.description}`
        : `Récurrence réactivée aujourd'hui — ${task.description}`,
    });
    res.json({ task });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
