import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireRole, requireCan } from "./auth.middleware";

function run(
  mw: (req: Request, res: Response, next: NextFunction) => void,
  session: Record<string, unknown>,
) {
  const req = { session } as unknown as Request;
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const res = { status, json } as unknown as Response;
  const next = vi.fn();
  mw(req, res, next);
  return { nextCalled: next.mock.calls.length > 0, code: status.mock.calls[0]?.[0] as number | undefined };
}

describe("requireRole (multi-rôle)", () => {
  it("passe si un des rôles de la session est autorisé", () => {
    const r = run(requireRole("comptable"), { userId: "u1", roleKeys: ["travailleur", "comptable"] });
    expect(r.nextCalled).toBe(true);
  });

  it("refuse (403) si aucun rôle n'est autorisé", () => {
    const r = run(requireRole("admin"), { userId: "u1", roleKeys: ["comptable", "mecanicien"] });
    expect(r.nextCalled).toBe(false);
    expect(r.code).toBe(403);
  });

  it("retombe sur roleKey pour une session legacy (sans roleKeys)", () => {
    const r = run(requireRole("admin"), { userId: "u1", roleKey: "admin" });
    expect(r.nextCalled).toBe(true);
  });

  it("401 sans session", () => {
    const r = run(requireRole("admin"), {});
    expect(r.code).toBe(401);
  });
});

describe("requireCan", () => {
  it("comptable peut gérer les finances", () => {
    const r = run(requireCan("finance", "manage"), { userId: "u1", roleKeys: ["comptable"] });
    expect(r.nextCalled).toBe(true);
  });

  it("mécanicien ne peut pas gérer les finances (403)", () => {
    const r = run(requireCan("finance", "manage"), { userId: "u1", roleKeys: ["mecanicien"] });
    expect(r.code).toBe(403);
  });

  it("développeur peut voir le journal d'audit", () => {
    const r = run(requireCan("audit", "view"), { userId: "u1", roleKeys: ["developpeur"] });
    expect(r.nextCalled).toBe(true);
  });

  it("union : travailleur + comptable peut voir l'audit", () => {
    const r = run(requireCan("audit", "view"), { userId: "u1", roleKeys: ["travailleur", "comptable"] });
    expect(r.nextCalled).toBe(true);
  });
});
