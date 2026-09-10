import type { NextFunction, Request, Response } from "express";
import type { RoleKey } from "@prisma/client";
import { can, hasConsoleAccess, type PermissionAction, type Section } from "./permissions";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

/**
 * Rôles de la session, sous forme de tableau. Retombe sur `[roleKey]` pour les
 * sessions créées avant l'introduction de `roleKeys` (pas de déconnexion forcée
 * au déploiement — elles se complètent à la prochaine connexion).
 */
export function sessionRoles(req: Request): RoleKey[] {
  if (req.session.roleKeys?.length) return req.session.roleKeys as RoleKey[];
  return req.session.roleKey ? [req.session.roleKey as RoleKey] : [];
}

/** Passe si AU MOINS UN des rôles de l'utilisateur est dans `allowed`. */
export function requireRole(...allowed: RoleKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const roles = sessionRoles(req);
    if (roles.length === 0) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.some((r) => allowed.includes(r))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

/** Passe si l'utilisateur a accès à au moins une section de la console. */
export function requireConsole(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!hasConsoleAccess(sessionRoles(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

/**
 * Garde basée sur la matrice de permissions de la Console de gestion.
 * `requireCan("finance", "manage")` — l'union des rôles doit autoriser l'action.
 */
export function requireCan(section: Section, action: PermissionAction = "view") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!can(sessionRoles(req), section, action)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
