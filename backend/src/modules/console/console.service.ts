import { prisma } from "../../db/prisma";
import { alertCounts as inventoryAlertCounts } from "../inventory/inventory.service";

/**
 * Compteurs d'alerte du menu de la Console de gestion.
 *
 * Candidatures en attente (magasin + tâche) + stock (seuil bas ou produit
 * chimique proche de la péremption, Lot 6) + incidents encore "ouverte"
 * (Lot 7 — pas "en_traitement", déjà pris en charge, pas une alerte).
 */
export async function getAlertCounts() {
  const [pendingStoreClaims, pendingTaskClaims, inventory, openIncidents] = await Promise.all([
    prisma.storeClaim.count({ where: { status: "pending" } }),
    prisma.taskClaim.count({ where: { status: "pending" } }),
    inventoryAlertCounts(),
    prisma.incident.count({ where: { status: "ouverte" } }),
  ]);

  const pendingClaims = pendingStoreClaims + pendingTaskClaims;
  const lowStock = inventory.lowStock + inventory.expiringSoon;

  return {
    pendingClaims,
    openIncidents,
    lowStock,
    total: pendingClaims + lowStock + openIncidents,
  };
}
