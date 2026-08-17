import type { Request, Response } from "express";
import type { RoleKey } from "@prisma/client";
import { userCreateSchema } from "./users.schema";
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
