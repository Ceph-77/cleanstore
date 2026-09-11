import { prisma } from "../../db/prisma";
import type { ContributionStatus } from "@prisma/client";

const include = {
  submittedBy: { select: { id: true, fullName: true, email: true } },
};

export interface CreateContributionInput {
  title: string;
  description: string;
  category?: string;
}

export function createContribution(input: CreateContributionInput, submittedById: string) {
  return prisma.contribution.create({ data: { ...input, submittedById }, include });
}

export function listContributions(status?: ContributionStatus) {
  return prisma.contribution.findMany({
    where: status ? { status } : undefined,
    include,
    orderBy: { createdAt: "desc" },
  });
}

/** Registre public des contributions adoptées — auteur + date, preuve d'antériorité (Q57). */
export function listRegistry() {
  return prisma.contribution.findMany({
    where: { status: "adoptee" },
    include,
    orderBy: { updatedAt: "desc" },
  });
}

export interface DecideContributionInput {
  status: ContributionStatus;
  decisionNote?: string;
  pointsAwarded?: number;
}

/**
 * Décision admin. Sur adoption avec des points, crée un PointEntry classique
 * (append-only, comme le reste du système d'engagement) — pas de prime $
 * automatique (Q55-57), le montant $ éventuel reste une prime manuelle du
 * Lot 5 (pas encore construit).
 */
export async function decideContribution(id: string, input: DecideContributionInput) {
  const contribution = await prisma.contribution.update({
    where: { id },
    data: { status: input.status, decisionNote: input.decisionNote, pointsAwarded: input.pointsAwarded ?? null },
    include,
  });
  if (input.status === "adoptee" && input.pointsAwarded && contribution.submittedById) {
    await prisma.pointEntry.create({
      data: {
        workerId: contribution.submittedById,
        kind: "contribution_reward",
        points: input.pointsAwarded,
      },
    });
  }
  return contribution;
}
