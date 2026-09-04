import type { Request, Response } from "express";
import type { RoleKey } from "@prisma/client";
import { userCreateSchema, userUpdateSchema } from "./users.schema";
import * as usersService from "./users.service";

export async function list(req: Request, res: Response) {
  const role = req.query.role as RoleKey | undefined;
  const users = await usersService.listUsersByRole(role);
  res.json({ users });
}

export async function create(req: Request, res: Response) {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await usersService.findUserByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({ error: "A user with this email already exists" });
  }

  const user = await usersService.createUser(parsed.data);
  res.status(201).json({ user });
}

export async function update(req: Request, res: Response) {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  if (req.params.id === req.session.userId && parsed.data.isActive === false) {
    return res.status(400).json({ error: "Vous ne pouvez pas désactiver votre propre compte." });
  }
  const user = await usersService.setUserActive(req.params.id, parsed.data.isActive);
  res.json({ user });
}

export async function remove(req: Request, res: Response) {
  if (req.params.id === req.session.userId) {
    return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
  }
  try {
    const deleted = await usersService.deleteUser(req.params.id);
    res.json({ deleted });
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
}
