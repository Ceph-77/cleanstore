import { prisma } from "../../db/prisma";
import { getInspectionWithUrls } from "../taskInspections/taskInspections.service";
import { getSignedDownloadUrl } from "../../utils/storage";
import { createEarningForCompletedTask } from "../payments/payments.service";
import type { TaskStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus>> = {
  claimed: "in_progress",
  in_progress: "completed",
};

export function listMyTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      assignedToId: userId,
      status: { in: ["claimed", "in_progress", "completed", "inspected"] },
    },
    include: {
      store: { select: { id: true, name: true, city: true, address: true } },
      expectedPhotos: true,
      steps: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listMyTasksWithUrls(userId: string) {
  const tasks = await listMyTasks(userId);
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

export async function updateMyTaskStatus(
  taskId: string,
  userId: string,
  nextStatus: "in_progress" | "completed",
  note: string | undefined
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== userId) {
    throw new Error("Task not found or not assigned to you");
  }
  if (ALLOWED_TRANSITIONS[task.status] !== nextStatus) {
    throw new Error(`Cannot move a task from "${task.status}" to "${nextStatus}"`);
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: nextStatus,
      ...(nextStatus === "in_progress" ? { startedAt: new Date() } : {}),
      ...(note !== undefined ? { workerNote: note } : {}),
    },
  });

  if (nextStatus === "completed") {
    await createEarningForCompletedTask(taskId);
  }

  return updated;
}

export async function toggleMyTaskStep(taskId: string, stepId: string, userId: string, isDone: boolean) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== userId) {
    throw new Error("Task not found or not assigned to you");
  }
  const step = await prisma.taskStep.findUnique({ where: { id: stepId } });
  if (!step || step.taskId !== taskId) {
    throw new Error("Step not found for this task");
  }
  return prisma.taskStep.update({ where: { id: stepId }, data: { isDone } });
}

export async function getMyTaskInspection(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== userId) {
    throw new Error("Task not found or not assigned to you");
  }
  return getInspectionWithUrls(taskId);
}
