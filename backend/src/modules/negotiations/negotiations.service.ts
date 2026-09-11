import { prisma } from "../../db/prisma";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";
import type { NegotiationStatus } from "@prisma/client";

const negotiationInclude = {
  offers: { orderBy: { createdAt: "asc" as const } },
  task: { select: { id: true, description: true, price: true, status: true, storeId: true } },
  worker: { select: { id: true, fullName: true, email: true } },
  clan: { select: { id: true, name: true } },
};

/**
 * Ouvre un fil de négociation — seulement sur une tâche `isNegotiable`,
 * toujours `open`/publiée/magasin actif (mêmes conditions que `createClaim`).
 * Un seul fil ouvert à la fois par (tâche, travailleur).
 */
export async function openNegotiation(
  taskId: string,
  workerId: string,
  amount: number,
  note?: string,
  clanId?: string,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { store: { select: { isActive: true, assignedSubcontractorId: true } } },
  });
  if (
    !task ||
    task.status !== "open" ||
    !task.isPublished ||
    !task.store.isActive ||
    !task.store.assignedSubcontractorId
  ) {
    throw new Error("Cette tâche n'est pas disponible pour une négociation.");
  }
  if (!task.isNegotiable) {
    throw new Error("Cette tâche n'est pas négociable.");
  }
  const existing = await prisma.taskNegotiation.findFirst({
    where: { taskId, workerId, status: "open" },
  });
  if (existing) {
    throw new Error("Vous avez déjà un fil de négociation ouvert pour cette tâche.");
  }

  return prisma.taskNegotiation.create({
    data: {
      taskId,
      workerId,
      clanId: clanId ?? null,
      offers: { create: { authorRole: "worker", authorId: workerId, amount, note } },
    },
    include: negotiationInclude,
  });
}

async function assertOpen(id: string) {
  const negotiation = await prisma.taskNegotiation.findUniqueOrThrow({ where: { id } });
  if (negotiation.status !== "open") {
    throw new Error("Ce fil de négociation est fermé.");
  }
  return negotiation;
}

/** Le travailleur (propriétaire du fil) ajoute une contre-offre. */
export async function addWorkerOffer(id: string, workerId: string, amount: number, note?: string) {
  const negotiation = await assertOpen(id);
  if (negotiation.workerId !== workerId) {
    throw new Error("Ce fil de négociation ne vous appartient pas.");
  }
  await prisma.taskNegotiationOffer.create({
    data: { negotiationId: id, authorRole: "worker", authorId: workerId, amount, note },
  });
  return prisma.taskNegotiation.findUniqueOrThrow({ where: { id }, include: negotiationInclude });
}

/** L'admin (ou inspecteur, via requireCan("markettask","manage")) contre-offre. */
export async function addAdminOffer(id: string, adminUserId: string, amount: number, note?: string) {
  await assertOpen(id);
  await prisma.taskNegotiationOffer.create({
    data: { negotiationId: id, authorRole: "admin", authorId: adminUserId, amount, note },
  });
  return prisma.taskNegotiation.findUniqueOrThrow({ where: { id }, include: negotiationInclude });
}

/**
 * Accord → prix figé sur la tâche + attribution au travailleur (comme une
 * candidature approuvée), ferme le fil, rejette les candidatures/négociations
 * concurrentes sur la même tâche.
 */
export async function acceptNegotiation(id: string, amount?: number, note?: string) {
  const negotiation = await assertOpen(id);
  const lastOffer = await prisma.taskNegotiationOffer.findFirst({
    where: { negotiationId: id },
    orderBy: { createdAt: "desc" },
  });
  const finalAmount = amount ?? (lastOffer ? Number(lastOffer.amount) : undefined);
  if (finalAmount == null || !Number.isFinite(finalAmount) || finalAmount <= 0) {
    throw new Error("Aucun montant à accepter.");
  }

  await prisma.$transaction([
    prisma.taskNegotiationOffer.create({
      data: { negotiationId: id, authorRole: "admin", amount: finalAmount, note: note ?? "Accepté" },
    }),
    prisma.taskNegotiation.update({ where: { id }, data: { status: "accepted" } }),
    prisma.task.update({
      where: { id: negotiation.taskId },
      data: {
        price: finalAmount,
        status: "claimed",
        assignedToId: negotiation.workerId,
        reservedByClanId: negotiation.clanId,
      },
    }),
    prisma.taskNegotiation.updateMany({
      where: { taskId: negotiation.taskId, status: "open", id: { not: id } },
      data: { status: "cancelled" },
    }),
    prisma.taskClaim.updateMany({
      where: { taskId: negotiation.taskId, status: "pending" },
      data: {
        status: "rejected",
        decidedAt: new Date(),
        decisionReason: "Tâche attribuée par négociation.",
      },
    }),
  ]);

  return prisma.taskNegotiation.findUniqueOrThrow({ where: { id }, include: negotiationInclude });
}

export async function rejectNegotiation(id: string, reason?: string) {
  await assertOpen(id);
  await prisma.taskNegotiation.update({ where: { id }, data: { status: "rejected" } });
  if (reason) {
    await prisma.taskNegotiationOffer.create({
      data: { negotiationId: id, authorRole: "admin", amount: 0, note: `Refusé — ${reason}` },
    });
  }
  return prisma.taskNegotiation.findUniqueOrThrow({ where: { id }, include: negotiationInclude });
}

export function listMyNegotiations(workerId: string) {
  return prisma.taskNegotiation.findMany({
    where: { workerId },
    include: negotiationInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listNegotiations(page: PageParams, status?: NegotiationStatus) {
  const rows = await prisma.taskNegotiation.findMany({
    where: status ? { status } : undefined,
    include: negotiationInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
  });
  return toPage(rows, page.limit);
}

export function getNegotiation(id: string) {
  return prisma.taskNegotiation.findUnique({ where: { id }, include: negotiationInclude });
}
