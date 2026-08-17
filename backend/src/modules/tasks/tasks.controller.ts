import type { Request, Response } from "express";
import { taskCreateSchema, taskUpdateSchema } from "./tasks.schema";
import * as tasksService from "./tasks.service";

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
  res.json({ task });
}

export async function unpublish(req: Request, res: Response) {
  const task = await tasksService.unpublishTask(req.params.id);
  res.json({ task });
}

export async function remove(req: Request, res: Response) {
  await tasksService.deleteTask(req.params.id);
  res.status(204).send();
}
