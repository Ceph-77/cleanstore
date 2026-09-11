import { prisma } from "../../db/prisma";

export function listForStore(storeId: string, includeInactive = false) {
  return prisma.storeInventoryItem.findMany({
    where: { storeId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
}

export function listMovements(itemId: string) {
  return prisma.inventoryMovement.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export interface ItemInput {
  kind: "consommable" | "produit_chimique" | "gaz" | "machine";
  name: string;
  unit?: string | null;
  quantity?: number;
  lowThreshold?: number | null;
  expiryDate?: Date | null;
  odometer?: number | null;
  lastServiceAt?: Date | null;
  nextServiceAt?: Date | null;
  condition?: string | null;
}

export function createItem(storeId: string, input: ItemInput) {
  return prisma.storeInventoryItem.create({ data: { ...input, storeId } });
}

/**
 * Édite les champs descriptifs (nom, seuils, dates, état…) — jamais la
 * quantité : elle ne bouge que par mouvement (restock/correction/consommation),
 * pour garder une trace complète de chaque changement de stock.
 */
export function updateItem(
  id: string,
  input: Partial<Omit<ItemInput, "quantity">> & { isActive?: boolean },
) {
  return prisma.storeInventoryItem.update({ where: { id }, data: input });
}

export function deactivateItem(id: string) {
  return prisma.storeInventoryItem.update({ where: { id }, data: { isActive: false } });
}

/** Réappro (qty > 0) ou correction manuelle (qty peut être négatif). */
export async function adjustQuantity(
  itemId: string,
  qty: number,
  actorId: string | null,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.storeInventoryItem.findUniqueOrThrow({ where: { id: itemId } });
    const next = Number(item.quantity) + qty;
    if (next < 0) throw new Error("La quantité ne peut pas devenir négative.");
    await tx.storeInventoryItem.update({ where: { id: itemId }, data: { quantity: next } });
    await tx.inventoryMovement.create({
      data: {
        itemId,
        delta: qty,
        reason: reason?.trim() || (qty >= 0 ? "reappro" : "correction"),
        actorId,
      },
    });
    return tx.storeInventoryItem.findUniqueOrThrow({ where: { id: itemId } });
  });
}

/**
 * Décrémente le matériel consommé par une tâche complétée (Task.consumables =
 * [{name, qty}], copié du modèle). *Best-effort* et silencieux : un article
 * introuvable ou une erreur ne doit jamais faire échouer la complétion de la
 * tâche — c'est un enrichissement du stock, pas une condition bloquante.
 */
export async function decrementForCompletedTask(
  taskId: string,
  storeId: string,
  consumables: unknown,
): Promise<void> {
  if (!Array.isArray(consumables) || consumables.length === 0) return;
  try {
    const items = await prisma.storeInventoryItem.findMany({
      where: { storeId, kind: "consommable", isActive: true },
    });
    const byName = new Map(items.map((i) => [i.name.trim().toLowerCase(), i]));

    for (const c of consumables as { name?: unknown; qty?: unknown }[]) {
      const name = typeof c.name === "string" ? c.name.trim() : "";
      const qty = typeof c.qty === "number" ? c.qty : Number(c.qty);
      if (!name || !Number.isFinite(qty) || qty <= 0) continue;
      const item = byName.get(name.toLowerCase());
      if (!item) continue;

      const delta = -Math.min(qty, Number(item.quantity)); // ne descend jamais sous 0
      await prisma.$transaction([
        prisma.storeInventoryItem.update({
          where: { id: item.id },
          data: { quantity: { increment: delta } },
        }),
        prisma.inventoryMovement.create({
          data: { itemId: item.id, delta, reason: "consommation_tache", taskId },
        }),
      ]);
    }
  } catch (err) {
    console.error("decrementForCompletedTask failed", err);
  }
}

const EXPIRY_WARNING_DAYS = 14;

/**
 * Compteurs d'alerte stock — branchés sur le compteur global de la console.
 * Prisma ne compare pas deux colonnes entre elles dans un `where` : on
 * récupère les candidats (peu nombreux — un seuil bas est l'exception, pas la
 * règle) et on compare côté serveur applicatif.
 */
export async function alertCounts() {
  const expiryLimit = new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const [candidates, expiringSoon] = await Promise.all([
    prisma.storeInventoryItem.findMany({
      where: { isActive: true, lowThreshold: { not: null } },
      select: { quantity: true, lowThreshold: true },
    }),
    prisma.storeInventoryItem.count({
      where: { isActive: true, kind: "produit_chimique", expiryDate: { lte: expiryLimit } },
    }),
  ]);
  const lowStock = candidates.filter((i) => Number(i.quantity) <= Number(i.lowThreshold)).length;
  return { lowStock, expiringSoon };
}

/**
 * Le détail (pas juste les compteurs) pour la page transversale
 * `/admin/inventory` — un article par magasin qui est bas ou proche de la
 * péremption, avec le nom du magasin pour pouvoir cliquer dessus.
 */
export async function alertItems() {
  const expiryLimit = new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const [lowCandidates, expiring] = await Promise.all([
    prisma.storeInventoryItem.findMany({
      where: { isActive: true, lowThreshold: { not: null } },
      include: { store: { select: { id: true, name: true } } },
    }),
    prisma.storeInventoryItem.findMany({
      where: { isActive: true, kind: "produit_chimique", expiryDate: { lte: expiryLimit } },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { expiryDate: "asc" },
    }),
  ]);
  const lowStock = lowCandidates.filter((i) => Number(i.quantity) <= Number(i.lowThreshold));
  return { lowStock, expiringSoon: expiring };
}
