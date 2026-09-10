import type { Request, Response } from "express";
import { myTaskStatusUpdateSchema, myTaskStepToggleSchema } from "./myTasks.schema";
import * as myTasksService from "./myTasks.service";
import { recordServerEvent } from "../analytics/analytics.service";

export async function list(req: Request, res: Response) {
  const tasks = await myTasksService.listMyTasksWithUrls(req.session.userId!);
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
      parsed.data.note,
      { lat: parsed.data.lat, lng: parsed.data.lng, accuracy: parsed.data.accuracy },
      parsed.data.reportedMetricValue,
      parsed.data.reportedUnits
    );
    void recordServerEvent(parsed.data.status === "completed" ? "task_completed" : "task_started", {
      userId: req.session.userId,
      role: req.session.roleKey ?? null,
      props: { taskId: task.id },
    }).catch(() => {});
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

export async function toggleStep(req: Request, res: Response) {
  const parsed = myTaskStepToggleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const step = await myTasksService.toggleMyTaskStep(
      req.params.id,
      req.params.stepId,
      req.session.userId!,
      parsed.data.isDone
    );
    res.json({ step });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}
