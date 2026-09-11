import { prisma } from "../../db/prisma";
import { recordLedgerEntry } from "../ledger/ledger.service";

const MAX_TOTAL_PERCENT = 85;
const round2 = (n: number): number => Math.round(n * 100) / 100;

const include = {
  claimant: { select: { id: true, fullName: true, email: true } },
  decidedBy: { select: { id: true, fullName: true, email: true } },
  task: { select: { id: true, description: true, assignedToId: true, reservedByClanId: true, status: true } },
};

/**
 * Un coéquipier de clan réclame un cran (25/50/75/85 %) sur une tâche
 * réservée au nom de son clan (Q8-18) — pas de photos cette tranche (voir
 * schema.prisma ClanShareClaim). Fenêtre : de la complétion au retrait du
 * gain, donc la tâche doit être au moins complétée.
 */
export async function createShareClaim(
  taskId: string,
  claimantId: string,
  percent: number,
  note?: string,
  completedStepIds: string[] = [],
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assignedToId: true, reservedByClanId: true, status: true },
  });
  if (!task) throw new Error("Tâche introuvable.");
  if (!task.reservedByClanId) throw new Error("Cette tâche n'est pas réservée au nom d'un clan.");
  if (task.assignedToId === claimantId) {
    throw new Error("Le réservateur n'a pas besoin de se réclamer une part à lui-même.");
  }
  if (!["completed", "inspected"].includes(task.status)) {
    throw new Error("La tâche doit être complétée avant de réclamer une part.");
  }
  const member = await prisma.clanMember.findUnique({
    where: { clanId_userId: { clanId: task.reservedByClanId, userId: claimantId } },
  });
  if (!member) throw new Error("Tu n'es pas membre du clan qui a réservé cette tâche.");

  return prisma.clanShareClaim.create({
    data: { taskId, claimantId, percent, note, completedStepIds },
    include,
  });
}

/** Modération/inspection — tous les fils, tous statuts (admin/inspecteur). */
export function listAll() {
  return prisma.clanShareClaim.findMany({ include, orderBy: { createdAt: "desc" }, take: 200 });
}

export function listForTask(taskId: string) {
  return prisma.clanShareClaim.findMany({ where: { taskId }, include, orderBy: { createdAt: "desc" } });
}

/**
 * Tâches réservées par MES clans, complétées, où je ne suis pas le
 * réservateur — celles où je peux réclamer une part (ClansPage).
 */
export async function listClaimableTasks(userId: string) {
  const memberships = await prisma.clanMember.findMany({ where: { userId }, select: { clanId: true } });
  const clanIds = memberships.map((m) => m.clanId);
  if (clanIds.length === 0) return [];
  return prisma.task.findMany({
    where: {
      reservedByClanId: { in: clanIds },
      status: { in: ["completed", "inspected"] },
      assignedToId: { not: userId },
    },
    select: {
      id: true,
      description: true,
      price: true,
      status: true,
      assignedToId: true,
      reservedByClanId: true,
      assignedTo: { select: { id: true, fullName: true, email: true } },
      store: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
}

export function listMine(claimantId: string) {
  return prisma.clanShareClaim.findMany({
    where: { claimantId },
    include,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Répartit vraiment l'argent — seulement possible une fois le gain du
 * réservateur "available" (délai 24h passé ou libéré par inspection). Avant
 * ça, aucun montant n'est encore confirmé collecté auprès du sous-traitant ;
 * partager plus tôt risquerait soit un double prélèvement Stripe (si chaque
 * part facturait séparément), soit de payer un coéquipier avant que l'argent
 * soit réellement rentré — les deux sont écartés en imposant ce moment-là.
 */
async function transferShare(taskId: string, reservateurId: string, claimantId: string, percent: number) {
  const earning = await prisma.workerEarning.findUnique({
    where: { taskId_workerId: { taskId, workerId: reservateurId } },
  });
  if (!earning) throw new Error("Aucun gain à partager pour cette tâche.");
  if (earning.status !== "available") {
    throw new Error(
      "Le gain de cette tâche doit d'abord être disponible (après le délai de 24h ou une inspection) avant de pouvoir le partager.",
    );
  }

  const alreadyShared = await prisma.clanShareClaim.aggregate({
    where: { taskId, status: { in: ["accepted", "inspector_awarded"] } },
    _sum: { percent: true },
  });
  const totalAfter = (alreadyShared._sum.percent ?? 0) + percent;
  if (totalAfter > MAX_TOTAL_PERCENT) {
    throw new Error(
      `Plafond dépassé : ${totalAfter} % transférés au total, maximum ${MAX_TOTAL_PERCENT} % (le réservateur garde toujours au moins 15 %).`,
    );
  }

  const transferAmount = round2(Number(earning.grossAmount) * (percent / 100));
  const nextGross = round2(Number(earning.grossAmount) - transferAmount);

  await prisma.$transaction([
    prisma.workerEarning.update({ where: { id: earning.id }, data: { grossAmount: nextGross } }),
    prisma.workerEarning.create({
      data: {
        taskId,
        workerId: claimantId,
        organizationId: earning.organizationId,
        grossAmount: transferAmount,
        status: "available",
        availableAt: new Date(),
      },
    }),
  ]);

  return transferAmount;
}

/** Le réservateur accepte ou refuse — seul lui peut décider (Q8-18). */
export async function decideShareClaim(
  claimId: string,
  deciderId: string,
  decision: "accepted" | "refused",
  decisionNote?: string,
) {
  const claim = await prisma.clanShareClaim.findUniqueOrThrow({ where: { id: claimId }, include: { task: true } });
  if (claim.status !== "pending") throw new Error("Cette réclamation a déjà été décidée.");
  if (claim.task.assignedToId !== deciderId) {
    throw new Error("Seul le réservateur de cette tâche peut décider de cette réclamation.");
  }

  if (decision === "refused") {
    return prisma.clanShareClaim.update({
      where: { id: claimId },
      data: { status: "refused", decidedById: deciderId, decisionNote, decidedAt: new Date() },
      include,
    });
  }

  const transferAmount = await transferShare(claim.taskId, deciderId, claim.claimantId, claim.percent);
  const updated = await prisma.clanShareClaim.update({
    where: { id: claimId },
    data: { status: "accepted", decidedById: deciderId, decisionNote, decidedAt: new Date() },
    include,
  });
  recordLedgerEntry({
    type: "transfert_clan",
    amount: transferAmount,
    partyAId: deciderId,
    partyAType: "user",
    partyBId: claim.claimantId,
    partyBType: "user",
    taskId: claim.taskId,
    reason: claim.note ?? "Partage de clan accepté",
  });
  return updated;
}

/**
 * Exception Q18 : l'inspecteur peut convertir un refus/silence en paiement
 * quand IL a demandé au coéquipier de faire/refaire une partie manquante —
 * seul cas où ça arrive sans accord du réservateur. Marche sur un fil
 * `pending` OU `refused` (jamais sur un fil déjà `accepted`).
 */
export async function inspectorAward(claimId: string, inspectorId: string, percent: number, decisionNote?: string) {
  const claim = await prisma.clanShareClaim.findUniqueOrThrow({ where: { id: claimId }, include: { task: true } });
  if (claim.status === "accepted" || claim.status === "inspector_awarded") {
    throw new Error("Cette réclamation a déjà été réglée.");
  }
  if (!claim.task.assignedToId) throw new Error("Cette tâche n'a pas de réservateur assigné.");

  const transferAmount = await transferShare(claim.taskId, claim.task.assignedToId, claim.claimantId, percent);
  const updated = await prisma.clanShareClaim.update({
    where: { id: claimId },
    data: { status: "inspector_awarded", percent, decidedById: inspectorId, decisionNote, decidedAt: new Date() },
    include,
  });
  recordLedgerEntry({
    type: "ajustement_inspecteur",
    amount: transferAmount,
    partyAId: claim.task.assignedToId,
    partyAType: "user",
    partyBId: claim.claimantId,
    partyBType: "user",
    taskId: claim.taskId,
    reason: decisionNote ?? "Part attribuée par un inspecteur — travail rattrapé confirmé",
  });
  return updated;
}
