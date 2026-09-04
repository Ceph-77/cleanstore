import type { Request, Response } from "express";
import type { RoleKey } from "@prisma/client";
import { userCreateSchema, userUpdateSchema } from "./users.schema";
import * as usersService from "./users.service";

export async function list(req: Request, res: Response) {
  const role = req.query.role as RoleKey | undefined;
  const users = await usersService.listUsersByRole(role);
  res.json({ users });
}

export async function getOne(req: Request, res: Response) {
  const user = await usersService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
  res.json({ user });
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
  const isSelf = req.params.id === req.session.userId;
  if (isSelf && parsed.data.isActive === false) {
    return res.status(400).json({ error: "Vous ne pouvez pas désactiver votre propre compte." });
  }
  if (isSelf && parsed.data.role !== undefined) {
    // an admin changing their own role would lock themselves out of admin
    return res.status(400).json({ error: "Vous ne pouvez pas changer votre propre rôle." });
  }
  try {
    const user = await usersService.updateUserAdmin(req.params.id, parsed.data);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
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
