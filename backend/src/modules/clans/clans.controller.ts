import type { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { createClanSchema, joinClanSchema, inviteSchema } from "./clans.schema";
import * as clans from "./clans.service";

async function myEmail(userId: string): Promise<string> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  return u.email;
}

export async function create(req: Request, res: Response) {
  const parsed = createClanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const clan = await clans.createClan(req.session.userId!, parsed.data.name);
  res.status(201).json({ clan });
}

export async function listMine(req: Request, res: Response) {
  res.json({ clans: await clans.myClans(req.session.userId!) });
}

export async function join(req: Request, res: Response) {
  const parsed = joinClanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const clan = await clans.joinByCode(req.session.userId!, parsed.data.code);
    res.json({ clan });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function invite(req: Request, res: Response) {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const inviteRow = await clans.inviteByEmail(req.params.id, req.session.userId!, parsed.data.email);
    res.status(201).json({ invite: inviteRow });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function listInvites(req: Request, res: Response) {
  const email = await myEmail(req.session.userId!);
  res.json({ invites: await clans.pendingInvitesForEmail(email) });
}

export async function acceptInvite(req: Request, res: Response) {
  try {
    const email = await myEmail(req.session.userId!);
    const clan = await clans.acceptInvite(req.session.userId!, email, req.params.inviteId);
    res.json({ clan });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function leave(req: Request, res: Response) {
  try {
    await clans.leaveClan(req.session.userId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function removeMember(req: Request, res: Response) {
  try {
    const clan = await clans.removeMember(req.session.userId!, req.params.id, req.params.userId);
    res.json({ clan });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
