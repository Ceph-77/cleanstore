import { describe, expect, it } from "vitest";
import { can, hasConsoleAccess, visibleSections, SECTIONS } from "./permissions";

describe("can()", () => {
  it("admin peut tout voir et tout gérer", () => {
    for (const s of SECTIONS) {
      expect(can(["admin"], s, "view")).toBe(true);
      expect(can(["admin"], s, "manage")).toBe(true);
    }
  });

  it("comptable : gère les finances, voit les utilisateurs mais ne les gère pas", () => {
    expect(can(["comptable"], "finance", "manage")).toBe(true);
    expect(can(["comptable"], "users", "view")).toBe(true);
    expect(can(["comptable"], "users", "manage")).toBe(false);
    expect(can(["comptable"], "settings", "view")).toBe(false);
    expect(can(["comptable"], "stores", "view")).toBe(false);
  });

  it("mecanicien : gère le stock, pas les finances", () => {
    expect(can(["mecanicien"], "inventory", "manage")).toBe(true);
    expect(can(["mecanicien"], "stores", "view")).toBe(true);
    expect(can(["mecanicien"], "finance", "view")).toBe(false);
  });

  it("chef_equipe : voit markettask, ne gère pas les finances", () => {
    expect(can(["chef_equipe"], "markettask", "view")).toBe(true);
    expect(can(["chef_equipe"], "markettask", "manage")).toBe(false);
    expect(can(["chef_equipe"], "finance", "view")).toBe(false);
  });

  it("developpeur : gère le feedback, voit l'audit, ne gère pas les magasins", () => {
    expect(can(["developpeur"], "feedback", "manage")).toBe(true);
    expect(can(["developpeur"], "audit", "view")).toBe(true);
    expect(can(["developpeur"], "stores", "view")).toBe(true);
    expect(can(["developpeur"], "stores", "manage")).toBe(false);
  });

  it("inspecteur : gère markettask (inspections), pas les finances", () => {
    expect(can(["inspecteur"], "markettask", "manage")).toBe(true);
    expect(can(["inspecteur"], "finance", "view")).toBe(false);
  });

  it("rôles hors console : aucun accès", () => {
    for (const rk of ["sous_traitant", "grande_compagnie", "travailleur"] as const) {
      expect(hasConsoleAccess([rk])).toBe(false);
      for (const s of SECTIONS) expect(can([rk], s, "view")).toBe(false);
    }
  });

  it("multi-rôle : l'accès est l'union des rôles", () => {
    const roles = ["comptable", "mecanicien"] as const;
    expect(can(roles, "finance", "manage")).toBe(true); // du comptable
    expect(can(roles, "inventory", "manage")).toBe(true); // du mécanicien
    expect(can(roles, "settings", "view")).toBe(false); // ni l'un ni l'autre
  });
});

describe("visibleSections()", () => {
  it("comptable voit un sous-ensemble ordonné comme SECTIONS", () => {
    const v = visibleSections(["comptable"]);
    expect(v).toEqual(["overview", "users", "markettask", "finance", "rewards", "audit", "analytics"]);
  });

  it("union de rôles = union des sections", () => {
    const v = visibleSections(["comptable", "mecanicien"]);
    expect(v).toContain("finance");
    expect(v).toContain("inventory");
    expect(v).not.toContain("settings");
  });

  it("admin voit toutes les sections", () => {
    expect(visibleSections(["admin"])).toEqual([...SECTIONS]);
  });
});
