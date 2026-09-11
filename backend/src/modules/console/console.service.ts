import { prisma } from "../../db/prisma";
import { alertCounts as inventoryAlertCounts } from "../inventory/inventory.service";

/**
 * Compteurs d'alerte du menu de la Console de gestion.
 *
 * Candidatures en attente (magasin + tâche) + stock (seuil bas ou produit
 * chimique proche de la péremption, Lot 6). `openIncidents` arrivera au Lot 7 —
 * la forme de la réponse est stable pour ne pas avoir à retoucher le front.
 */
export async function getAlertCounts() {
  const [pendingStoreClaims, pendingTaskClaims, inventory] = await Promise.all([
    prisma.storeClaim.count({ where: { status: "pending" } }),
    prisma.taskClaim.count({ where: { status: "pending" } }),
    inventoryAlertCounts(),
  ]);

  const pendingClaims = pendingStoreClaims + pendingTaskClaims;
  const lowStock = inventory.lowStock + inventory.expiringSoon;

  return {
    pendingClaims,
    openIncidents: 0, // lot 7
    lowStock,
    total: pendingClaims + lowStock,
  };
}
