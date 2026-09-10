import { prisma } from "../../db/prisma";

/**
 * Compteurs d'alerte du menu de la Console de gestion.
 *
 * Aujourd'hui : candidatures en attente d'approbation (magasin + tâche).
 * Les champs `openIncidents` / `lowStock` arriveront avec les lots 6 et 7 —
 * la forme de la réponse est stable pour ne pas avoir à retoucher le front.
 */
export async function getAlertCounts() {
  const [pendingStoreClaims, pendingTaskClaims] = await Promise.all([
    prisma.storeClaim.count({ where: { status: "pending" } }),
    prisma.taskClaim.count({ where: { status: "pending" } }),
  ]);

  const pendingClaims = pendingStoreClaims + pendingTaskClaims;

  return {
    pendingClaims,
    openIncidents: 0, // lot 7
    lowStock: 0, // lot 6
    total: pendingClaims,
  };
}
