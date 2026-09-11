import type { Request, Response } from "express";
import { pageParamsSchema } from "../../utils/pagination";
import { sessionRoles } from "../auth/auth.middleware";
import {
  createAdhocThreadSchema,
  editMessageSchema,
  globalThreadKindSchema,
  postMessageSchema,
} from "./messages.schema";
import * as service from "./messages.service";

export async function listMine(req: Request, res: Response) {
  const threads = await service.listMyThreads(req.session.userId!);
  res.json({ threads });
}

export async function listAll(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  const { items, nextCursor } = await service.listAllThreads(page.data);
  res.json({ threads: items, nextCursor });
}

export async function global(req: Request, res: Response) {
  const parsed = globalThreadKindSchema.safeParse(req.params.kind);
  if (!parsed.success) return res.status(400).json({ error: "Fil global inconnu." });
  const thread = await service.ensureGlobalThread(parsed.data);
  res.json({ thread });
}

export async function taskThread(req: Request, res: Response) {
  try {
    const thread = await service.getOrCreateTaskThread(
      req.params.taskId,
      req.session.userId!,
      sessionRoles(req),
    );
    res.json({ thread });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function clanThread(req: Request, res: Response) {
  try {
    const thread = await service.getOrCreateClanThread(
      req.params.clanId,
      req.session.userId!,
      sessionRoles(req),
    );
    res.json({ thread });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function createAdhoc(req: Request, res: Response) {
  const parsed = createAdhocThreadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const thread = await service.createAdhocThread(
      req.session.userId!,
      parsed.data.participantIds,
      parsed.data.title,
    );
    res.status(201).json({ thread });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listMessages(req: Request, res: Response) {
  const page = pageParamsSchema.safeParse(req.query);
  if (!page.success) return res.status(400).json({ error: page.error.flatten() });
  try {
    const { thread, items, nextCursor } = await service.listMessages(
      req.params.id,
      req.session.userId!,
      sessionRoles(req),
      page.data,
    );
    res.json({ thread, messages: items, nextCursor });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function postMessage(req: Request, res: Response) {
  const parsed = postMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const message = await service.postMessage(
      req.params.id,
      req.session.userId!,
      sessionRoles(req),
      parsed.data.body,
    );
    res.status(201).json({ message });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function editMessage(req: Request, res: Response) {
  const parsed = editMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const message = await service.editMessage(req.params.id, req.session.userId!, parsed.data.body);
    res.json({ message });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
