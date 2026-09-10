/**
 * Journal d'audit de la Console de gestion.
 *
 * `recordAudit()` : écriture *fire-and-forget-safe* — ne lève jamais, pour ne
 * jamais casser l'action métier qu'elle journalise (mêmes règles que le module
 * `engagement`). Les controllers l'appellent après une mutation réussie.
 *
 * `listAudit()` : lecture paginée (curseur) pour la page « Journal d'audit ».
 *
 * Périmètre (décision Q2, 2026-09-10) : actions de GESTION uniquement — pas les
 * changements de statut de tâche côté travailleur (déjà couverts par analytics
 * + point entries).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";

export type AuditAction = "create" | "update" | "delete" | "decision";

export interface AuditInput {
  /** id du compte auteur, ou null (action système / cron). */
  actorId?: string | null;
  /** Identité figée « Nom · rôle » au moment de l'action (survit à la suppression du compte). */
  actorLabel?: string | null;
  action: AuditAction | (string & {});
  /** Section de la console concernée (voir permissions.ts SECTIONS). */
  section: string;
  /** Type d'entité touchée, ex. "Store", "User", "TaskTemplate". */
  entityType: string;
  entityId?: string | null;
  /** Phrase lisible, ex. « prix « Balayage » 45,00 $ → 52,00 $ ». */
  summary?: string | null;
  before?: unknown;
  after?: unknown;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const data: Prisma.AuditLogCreateInput = {
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel ?? null,
      action: input.action,
      section: input.section,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
    };
    if (input.before !== undefined && input.before !== null) {
      data.before = input.before as Prisma.InputJsonValue;
    }
    if (input.after !== undefined && input.after !== null) {
      data.after = input.after as Prisma.InputJsonValue;
    }
    await prisma.auditLog.create({ data });
  } catch (err) {
    console.error("recordAudit failed", err);
  }
}

export interface AuditListFilters extends PageParams {
  section?: string;
  action?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
}

export async function listAudit(filters: AuditListFilters) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.section) where.section = filters.section;
  if (filters.action) where.action = filters.action;
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(filters),
  });
  return toPage(rows, filters.limit);
}
