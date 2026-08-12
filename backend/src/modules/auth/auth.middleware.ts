import type { NextFunction, Request, Response } from "express";
import type { RoleKey } from "@prisma/client";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function requireRole(...allowed: RoleKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.roleKey) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowed.includes(req.session.roleKey as RoleKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
