import { prisma } from "../../db/prisma";
import { getSignedDownloadUrl } from "../../utils/storage";
import { sendClaimDecisionEmail } from "../../utils/email";
import { startOfCurrentWeek } from "../../utils/week";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";
import { assertCanEditTask } from "../taskInstructions/taskInstructions.service";
import type { ClaimStatus } from "@prisma/client";

/** A worker may submit at most this many task claims per store per calendar week. */
export const MAX_CLAIMS_PER_STORE_PER_WEEK = 3;

export async function listMarketplaceTasks(page: PageParams) {
  const rows = await prisma.task.findMany({
    where: {
      status: "open",
      isPublished: true,
      store: { assignedSubcontractorId: { not: null }, isActive: true },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
    select: {
      id: true,
      storeId: true,
      description: true,
      taskType: true,
      price: true,
      isNegotiable: true,
      isPublished: true,
      dueDate: true,
      status: true,
      assignedToId: true,
      createdAt: true,
      updatedAt: true,
      expectedResultText: true,
      requiredEquipment: true,
      estimatedDurationMinutes: true,
      metricLabel: true,
      metricUnit: true,
      metricTarget: true,
      store: { select: { id: true, name: true, city: true, address: true } },
      expectedPhotos: true,
    },
  });
  return toPage(rows, page.limit);
}

export async function listMarketplaceTasksWithUrls(page: PageParams) {
  const { items, nextCursor } = await listMarketplaceTasks(page);
  const withUrls = await Promise.all(
    items.map(async (task) => ({
      ...task,
      expectedPhotos: await Promise.all(
        task.expectedPhotos.map(async (photo) => ({
          ...photo,
          downloadUrl: await getSignedDownloadUrl(photo.fileKey),
        }))
      ),
    }))
  );
  return { items: withUrls, nextCursor };
}

export async function createClaim(taskId: string, workerId: string, note?: string) {
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
    throw new Error("This task is not available for claiming");
  }

  const claimsThisWeek = await prisma.taskClaim.count({
    where: {
      workerId,
      task: { storeId: task.storeId },
      createdAt: { gte: startOfCurrentWeek() },
    },
  });
  if (claimsThisWeek >= MAX_CLAIMS_PER_STORE_PER_WEEK) {
    throw new Error(
      `Limite atteinte : vous avez déjà soumis ${MAX_CLAIMS_PER_STORE_PER_WEEK} candidatures pour ce magasin cette semaine. ` +
        "Un administrateur peut vous attribuer une tâche supplémentaire directement."
    );
  }

  return prisma.taskClaim.create({ data: { taskId, workerId, note } });
}

/** Active workers a subcontractor can assign a task to. */
export function listAssignableWorkers() {
  return prisma.user.findMany({
    where: { isActive: true, roles: { some: { role: { key: "travailleur" } } } },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });
}

/**
 * A subcontractor assigns one of their workers directly to a task on one of
 * their own stores, bypassing the claim flow. Any pending claim on that task is
 * rejected. Only usable while the task is still open or claimed (not started).
 */
export async function directAssignTask(taskId: string, workerId: string, subUserId: string) {
  await assertCanEditTask(taskId, subUserId, "sous_traitant");

  const [task, worker] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId }, select: { status: true } }),
    prisma.user.findFirst({
      where: { id: workerId, isActive: true, roles: { some: { role: { key: "travailleur" } } } },
      select: { id: true },
    }),
  ]);
  if (!task) throw new Error("Tâche introuvable.");
  if (!worker) throw new Error("Travailleur introuvable ou inactif.");
  if (task.status !== "open" && task.status !== "claimed") {
    throw new Error("Cette tâche ne peut plus être réattribuée (déjà démarrée ou terminée).");
  }

  const [updated] = await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { assignedToId: workerId, status: "claimed" },
    }),
    prisma.taskClaim.updateMany({
      where: { taskId, status: "pending" },
      data: {
        status: "rejected",
        decidedAt: new Date(),
        decisionReason: "Tâche attribuée directement par le sous-traitant.",
      },
    }),
  ]);
  return updated;
}

export function listMyClaims(userId: string) {
  return prisma.taskClaim.findMany({
    where: { workerId: userId },
    include: { task: { include: { store: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listClaims(page: PageParams, status?: ClaimStatus) {
  const rows = await prisma.taskClaim.findMany({
    where: status ? { status } : undefined,
    include: {
      task: { include: { store: { select: { id: true, name: true } } } },
      worker: {
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              assignedTasks: { where: { status: { in: ["completed", "inspected"] } } },
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
  });
  const { items: claims, nextCursor } = toPage(rows, page.limit);

  const workerIds = [...new Set(claims.map((c) => c.workerId))];
  const inspections = await prisma.taskInspection.findMany({
    where: { task: { assignedToId: { in: workerIds } } },
    select: { score: true, task: { select: { assignedToId: true } } },
  });
  const scoresByWorker = new Map<string, number[]>();
  for (const inspection of inspections) {
    const workerId = inspection.task.assignedToId;
    if (!workerId) continue;
    const scores = scoresByWorker.get(workerId) ?? [];
    scores.push(inspection.score);
    scoresByWorker.set(workerId, scores);
  }

  const items = claims.map((claim) => {
    const scores = scoresByWorker.get(claim.workerId);
    const averageScore = scores && scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { ...claim, worker: { ...claim.worker, averageInspectionScore: averageScore } };
  });
  return { items, nextCursor };
}

export async function decideClaim(id: string, status: "approved" | "rejected", reason?: string) {
  const claim = await prisma.taskClaim.findUniqueOrThrow({ where: { id } });

  if (status === "approved") {
    await prisma.$transaction([
      prisma.task.update({
        where: { id: claim.taskId },
        data: { assignedToId: claim.workerId, status: "claimed" },
      }),
      prisma.taskClaim.update({
        where: { id },
        data: { status: "approved", decidedAt: new Date() },
      }),
      prisma.taskClaim.updateMany({
        where: { taskId: claim.taskId, status: "pending", id: { not: id } },
        data: { status: "rejected", decidedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.taskClaim.update({
      where: { id },
      data: { status: "rejected", decidedAt: new Date(), decisionReason: reason },
    });
  }

  const decided = await prisma.taskClaim.findUniqueOrThrow({
    where: { id },
    include: {
      task: { select: { description: true } },
      worker: { select: { email: true, fullName: true } },
    },
  });

  await sendClaimDecisionEmail(decided.worker.email, {
    itemLabel: decided.task.description,
    status,
    reason: decided.decisionReason,
  }).catch(() => {});

  return decided;
}
