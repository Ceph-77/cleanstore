import type { Request, Response } from "express";
import type { RoleKey } from "@prisma/client";
import {
  taskInstructionsUpdateSchema,
  taskStepCreateSchema,
  taskStepUpdateSchema,
} from "./taskInstructions.schema";
import * as taskInstructionsService from "./taskInstructions.service";

async function guard(req: Request, res: Response): Promise<boolean> {
  try {
    await taskInstructionsService.assertCanEditTask(
      req.params.taskId,
      req.session.userId!,
      req.session.roleKey as RoleKey
    );
    return true;
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
    return false;
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const tasks = await taskInstructionsService.listTasksForSubcontractor(req.session.userId!);
    res.json({ tasks });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function get(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  const task = await taskInstructionsService.getInstructionsWithUrls(req.params.taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json({ task });
}

export async function update(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  const parsed = taskInstructionsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const task = await taskInstructionsService.updateInstructions(req.params.taskId, parsed.data);
  res.json({ task });
}

export async function addPhoto(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const task = await taskInstructionsService.addExpectedPhotos(req.params.taskId, files);
  res.status(201).json({ task });
}

export async function deletePhoto(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  try {
    await taskInstructionsService.deleteExpectedPhoto(req.params.taskId, req.params.photoId);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

export async function addStep(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  const parsed = taskStepCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const step = await taskInstructionsService.addStep(req.params.taskId, parsed.data.text);
  res.status(201).json({ step });
}

export async function updateStep(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  const parsed = taskStepUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const step = await taskInstructionsService.updateStep(req.params.taskId, req.params.stepId, parsed.data.text);
    res.json({ step });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

export async function deleteStep(req: Request, res: Response) {
  if (!(await guard(req, res))) return;
  try {
    await taskInstructionsService.deleteStep(req.params.taskId, req.params.stepId);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}
