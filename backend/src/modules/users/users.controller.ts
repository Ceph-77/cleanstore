import type { Request, Response } from "express";
import type { RoleKey } from "@prisma/client";
import * as usersService from "./users.service";

export async function list(req: Request, res: Response) {
  const role = req.query.role as RoleKey | undefined;
  const users = await usersService.listUsersByRole(role);
  res.json({ users });
}
