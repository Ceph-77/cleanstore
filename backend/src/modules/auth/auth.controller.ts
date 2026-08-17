import type { Request, Response } from "express";
import { loginSchema, registerWorkerSchema } from "./auth.schema";
import { authenticate, getUserById, registerWorker } from "./auth.service";

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid credentials format" });
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.userId = user.id;
  req.session.roleKey = user.roleKey ?? undefined;

  res.json({ user });
}

export async function registerWorkerHandler(req: Request, res: Response) {
  const parsed = registerWorkerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const user = await registerWorker(parsed.data);
    req.session.userId = user.id;
    req.session.roleKey = user.roleKey;
    res.status(201).json({ user });
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
}

export function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
}

export async function me(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({ user });
}
