import { Prisma, type LedgerEntryType } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";

export type LedgerPartyType = "user" | "organization";

export interface LedgerInput {
  type:
    | "gain_cree"
    | "gain_dispo"
    | "commission"
    | "penalite"
    | "prime"
    | "transfert_clan"
    | "retrait"
    | "retrait_echoue"
    | "abonnement"
    | "charge_sous_traitant"
    | "ajustement_inspecteur";
  amount: number;
  currency?: string;
  partyAId?: string | null;
  partyAType?: LedgerPartyType | null;
  partyBId?: string | null;
  partyBType?: LedgerPartyType | null;
  taskId?: string | null;
  reason?: string | null;
  status?: string;
}

/**
 * Écrit une ligne du grand livre. Append-only, fire-and-forget-safe : ne lève
 * jamais, pour ne jamais casser le flux d'argent réel (gain/paiement/retrait)
 * qu'elle journalise. Aucune méthode de mise à jour n'existe volontairement.
 */
export function recordLedgerEntry(input: LedgerInput): void {
  void prisma.ledgerEntry
    .create({
      data: {
        type: input.type,
        amount: input.amount,
        currency: input.currency ?? "CAD",
        partyAId: input.partyAId ?? null,
        partyAType: input.partyAType ?? null,
        partyBId: input.partyBId ?? null,
        partyBType: input.partyBType ?? null,
        taskId: input.taskId ?? null,
        reason: input.reason ?? null,
        status: input.status ?? "posted",
      },
    })
    .catch((err) => console.error("recordLedgerEntry failed", err));
}

export interface LedgerFilters extends PageParams {
  type?: string;
  partyAId?: string;
  from?: Date;
  to?: Date;
}

async function resolvePartyNames(ids: { id: string; type: string | null }[]) {
  const userIds = ids.filter((x) => x.type !== "organization").map((x) => x.id);
  const orgIds = ids.filter((x) => x.type === "organization").map((x) => x.id);
  const [users, orgs] = await Promise.all([
    userIds.length
      ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } })
      : [],
    orgIds.length ? prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } }) : [],
  ]);
  const names = new Map<string, string>();
  for (const u of users) names.set(u.id, u.fullName ?? u.email);
  for (const o of orgs) names.set(o.id, o.name);
  return names;
}

export async function listLedger(filters: LedgerFilters) {
  const where: Prisma.LedgerEntryWhereInput = {};
  if (filters.type) where.type = filters.type as LedgerEntryType;
  if (filters.partyAId) where.partyAId = filters.partyAId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const rows = await prisma.ledgerEntry.findMany({
    where,
    include: { task: { select: { id: true, description: true, storeId: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(filters),
  });
  const page = toPage(rows, filters.limit);

  const ids = page.items.flatMap((r) =>
    [
      r.partyAId ? { id: r.partyAId, type: r.partyAType } : null,
      r.partyBId ? { id: r.partyBId, type: r.partyBType } : null,
    ].filter((x): x is { id: string; type: string | null } => x !== null),
  );
  const names = await resolvePartyNames(ids);

  return {
    ...page,
    items: page.items.map((r) => ({
      ...r,
      partyAName: r.partyAId ? (names.get(r.partyAId) ?? null) : null,
      partyBName: r.partyBId ? (names.get(r.partyBId) ?? null) : null,
    })),
  };
}

/**
 * Vue simplifiée : Passif = dû aux travailleurs non retiré (gains pending +
 * available). Actif = commissions encaissées à ce jour (somme des écritures
 * `commission`). Le reste du tableau de bord financier (charges à encaisser,
 * pénalités/primes nettes…) vient avec la suite du Lot 5.
 */
export async function ledgerSummary() {
  const [dueToWorkers, commissions] = await Promise.all([
    prisma.workerEarning.aggregate({
      where: { status: { in: ["pending", "available"] } },
      _sum: { grossAmount: true },
    }),
    prisma.ledgerEntry.aggregate({ where: { type: "commission" }, _sum: { amount: true } }),
  ]);
  return {
    passif: Number(dueToWorkers._sum.grossAmount ?? 0),
    actif: Number(commissions._sum.amount ?? 0),
  };
}

/**
 * Toutes les écritures où `workerId` est une des deux parties, sur une
 * fenêtre de dates — sert au relevé mensuel (Q58-60) : gains, primes,
 * pénalités, transferts de clan reçus/donnés, dans l'ordre chronologique.
 */
export function listLedgerForParty(partyId: string, from: Date, to: Date) {
  return prisma.ledgerEntry.findMany({
    where: {
      createdAt: { gte: from, lt: to },
      OR: [{ partyAId: partyId }, { partyBId: partyId }],
    },
    include: { task: { select: { id: true, description: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}
