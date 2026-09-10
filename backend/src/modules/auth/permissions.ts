/**
 * Table de permissions de la Console de gestion + helper `can()`.
 *
 * Décisions Lot 0 (2026-09-10) :
 *  - Rôles FIXES à accès prédéfini. La table ci-dessous est statique (en code) ;
 *    elle passera en base « à la longue » sans changer la signature de `can()`.
 *  - Multi-rôle : l'accès d'un utilisateur = l'UNION de ses rôles.
 *  - 2 actions pour l'instant : `view` (voir la section) et `manage`
 *    (créer / modifier / supprimer / décider). On affinera par section plus tard.
 *
 * `admin` a tout. Les rôles hors console (`sous_traitant`, `grande_compagnie`,
 * `travailleur`) n'ont AUCUN accès console — ils gardent leurs espaces dédiés.
 */
import type { RoleKey } from "@prisma/client";

export const SECTIONS = [
  "overview", // Vue d'ensemble
  "stores", // Magasins
  "task_templates", // Modèles de tâches
  "users", // Utilisateurs & équipes
  "markettask", // Suivi des travaux + Demandes (+ négociation/inspection à venir)
  "finance", // Portefeuille & finances
  "inventory", // Équipements & stock
  "feedback", // Feedback & incidents
  "rewards", // Rewards
  "audit", // Journal d'audit
  "analytics", // Parcours
  "settings", // Réglages
] as const;

export type Section = (typeof SECTIONS)[number];
export type PermissionAction = "view" | "manage";

const VIEW: PermissionAction[] = ["view"];
const FULL: PermissionAction[] = ["view", "manage"];

type Matrix = Partial<Record<Section, PermissionAction[]>>;

const adminAll: Matrix = Object.fromEntries(SECTIONS.map((s) => [s, FULL])) as Matrix;

/**
 * rôle -> sections accessibles. Une section absente = aucun accès.
 * Proposition de départ (Q5) — Céphas ajuste en testant.
 */
const PERMISSIONS: Record<RoleKey, Matrix> = {
  admin: adminAll,

  comptable: {
    overview: VIEW,
    finance: FULL,
    users: VIEW,
    markettask: VIEW,
    rewards: VIEW,
    audit: VIEW,
    analytics: VIEW,
  },

  mecanicien: {
    overview: VIEW,
    inventory: FULL,
    stores: VIEW,
    markettask: VIEW,
  },

  chef_equipe: {
    overview: VIEW,
    markettask: VIEW, // voir + ouvrir les fils/photos — actions fines ajoutées plus tard
    users: VIEW, // limité à son clan côté données (filtrage au niveau service)
    rewards: VIEW,
    feedback: VIEW,
  },

  developpeur: {
    overview: VIEW,
    audit: VIEW,
    analytics: VIEW,
    feedback: FULL, // aiguillage technique
    stores: VIEW,
    task_templates: VIEW,
    users: VIEW,
    markettask: VIEW,
    inventory: VIEW,
    settings: VIEW,
  },

  inspecteur: {
    overview: VIEW,
    markettask: FULL, // inspections
    feedback: VIEW,
  },

  // hors console
  sous_traitant: {},
  grande_compagnie: {},
  travailleur: {},
};

/** L'un des rôles de l'utilisateur autorise-t-il `action` sur `section` ? */
export function can(
  roleKeys: readonly RoleKey[],
  section: Section,
  action: PermissionAction = "view",
): boolean {
  return roleKeys.some((rk) => PERMISSIONS[rk]?.[section]?.includes(action) ?? false);
}

/** Sections visibles dans le menu pour cet ensemble de rôles (ordre de SECTIONS). */
export function visibleSections(roleKeys: readonly RoleKey[]): Section[] {
  return SECTIONS.filter((s) => can(roleKeys, s, "view"));
}

/** L'utilisateur a-t-il accès à au moins une section de la console ? */
export function hasConsoleAccess(roleKeys: readonly RoleKey[]): boolean {
  return roleKeys.some((rk) => Object.keys(PERMISSIONS[rk] ?? {}).length > 0);
}
