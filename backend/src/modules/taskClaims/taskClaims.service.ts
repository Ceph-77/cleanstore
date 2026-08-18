import { prisma } from "../../db/prisma";
import { getSignedDownloadUrl } from "../../utils/storage";
import type { ClaimStatus } from "@prisma/client";

export function listMarketplaceTasks() {
  return prisma.task.findMany({
    where: {
      status: "open",
      isPublished: true,
      store: { assignedSubcontractorId: { not: null }, isActive: true },
    },
    orderBy: { createdAt: "desc" },
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
      store: { select: { id: true, name: true, city: true, address: true } },
      expectedPhotos: true,
    },
  });
}

export async function listMarketplaceTasksWithUrls() {
  const tasks = await listMarketplaceTasks();
  return Promise.all(
    tasks.map(async (task) => ({
      ...task,
      expectedPhotos: await Promise.all(
        task.expectedPhotos.map(async (photo) => ({
          ...photo,
          downloadUrl: await getSignedDownloadUrl(photo.fileKey),
        }))
      ),
    }))
  );
}

export async function createClaim(taskId: string, workerId: string) {
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

  return prisma.taskClaim.create({ data: { taskId, workerId } });
}

export function listMyClaims(userId: string) {
  return prisma.taskClaim.findMany({
    where: { workerId: userId },
    include: { task: { include: { store: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export function listClaims(status?: ClaimStatus) {
  return prisma.taskClaim.findMany({
    where: status ? { status } : undefined,
    include: {
      task: { include: { store: { select: { id: true, name: true } } } },
      worker: {
        select: {
          id: true,
          fullName: true,
          email: true,
          _count: {
            select: {
              assignedTasks: { where: { status: { in: ["completed", "inspected"] } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function decideClaim(id: string, status: "approved" | "rejected") {
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
      data: { status: "rejected", decidedAt: new Date() },
    });
  }

  return prisma.taskClaim.findUniqueOrThrow({ where: { id } });
}
