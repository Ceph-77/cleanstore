import { prisma } from "../../db/prisma";
import { sendClaimDecisionEmail } from "../../utils/email";
import type { ClaimStatus } from "@prisma/client";

export function listAvailableStores() {
  return prisma.store.findMany({
    where: { isActive: true, assignedSubcontractorId: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      banner: true,
      city: true,
      address: true,
      cleaningFrequency: true,
      grandeCompagnie: { select: { id: true, name: true } },
    },
  });
}

async function getSubcontractorOrganizationId(userId: string) {
  const userRole = await prisma.userRole.findFirst({
    where: { userId, role: { key: "sous_traitant" } },
  });
  if (!userRole?.organizationId) {
    throw new Error("User is not linked to a sous-traitant organization");
  }
  return userRole.organizationId;
}

export async function createClaim(storeId: string, userId: string, note?: string) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store || !store.isActive || store.assignedSubcontractorId) {
    throw new Error("This store is not available for claiming");
  }

  const organizationId = await getSubcontractorOrganizationId(userId);
  return prisma.storeClaim.create({
    data: { storeId, organizationId, requestedById: userId, note },
  });
}

export function listMyClaims(userId: string) {
  return prisma.storeClaim.findMany({
    where: { requestedById: userId },
    include: { store: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function listClaims(status?: ClaimStatus) {
  return prisma.storeClaim.findMany({
    where: status ? { status } : undefined,
    include: {
      store: { select: { id: true, name: true, city: true } },
      organization: {
        select: { id: true, name: true, _count: { select: { storesAsSubcontractor: true } } },
      },
      requestedBy: { select: { id: true, fullName: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function decideClaim(id: string, status: "approved" | "rejected", reason?: string) {
  const claim = await prisma.storeClaim.findUniqueOrThrow({ where: { id } });

  if (status === "approved") {
    await prisma.$transaction([
      prisma.store.update({
        where: { id: claim.storeId },
        data: { assignedSubcontractorId: claim.organizationId },
      }),
      prisma.storeClaim.update({
        where: { id },
        data: { status: "approved", decidedAt: new Date() },
      }),
      prisma.storeClaim.updateMany({
        where: { storeId: claim.storeId, status: "pending", id: { not: id } },
        data: { status: "rejected", decidedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.storeClaim.update({
      where: { id },
      data: { status: "rejected", decidedAt: new Date(), decisionReason: reason },
    });
  }

  const decided = await prisma.storeClaim.findUniqueOrThrow({
    where: { id },
    include: {
      store: { select: { name: true } },
      requestedBy: { select: { email: true } },
    },
  });

  await sendClaimDecisionEmail(decided.requestedBy.email, {
    itemLabel: decided.store.name,
    status,
    reason: decided.decisionReason,
  }).catch(() => {});

  return decided;
}
