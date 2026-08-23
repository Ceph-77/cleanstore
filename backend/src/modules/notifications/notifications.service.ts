import { prisma } from "../../db/prisma";

export async function getUnseenDecisionsCount(userId: string) {
  const [taskClaims, storeClaims] = await Promise.all([
    prisma.taskClaim.count({
      where: { workerId: userId, decidedAt: { not: null }, seenByRequesterAt: null },
    }),
    prisma.storeClaim.count({
      where: { requestedById: userId, decidedAt: { not: null }, seenByRequesterAt: null },
    }),
  ]);
  return taskClaims + storeClaims;
}

export async function markDecisionsSeen(userId: string) {
  const now = new Date();
  await Promise.all([
    prisma.taskClaim.updateMany({
      where: { workerId: userId, decidedAt: { not: null }, seenByRequesterAt: null },
      data: { seenByRequesterAt: now },
    }),
    prisma.storeClaim.updateMany({
      where: { requestedById: userId, decidedAt: { not: null }, seenByRequesterAt: null },
      data: { seenByRequesterAt: now },
    }),
  ]);
}
