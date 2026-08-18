import type { Request, Response } from "express";
import { myTaskStatusUpdateSchema } from "./myTasks.schema";
import * as myTasksService from "./myTasks.service";

export async function list(req: Request, res: Response) {
  const tasks = await myTasksService.listMyTasks(req.session.userId!);
  res.json({ tasks });
}

export async function updateStatus(req: Request, res: Response) {
  const parsed = myTaskStatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const task = await myTasksService.updateMyTaskStatus(
      req.params.id,
      req.session.userId!,
      parsed.data.status,
      parsed.data.note
    );
    res.json({ task });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getInspection(req: Request, res: Response) {
  try {
    const inspection = await myTasksService.getMyTaskInspection(req.params.id, req.session.userId!);
    res.json({ inspection });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}
