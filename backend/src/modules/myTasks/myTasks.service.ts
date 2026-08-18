import { prisma } from "../../db/prisma";
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
    include: { store: { select: { id: true, name: true, city: true, address: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateMyTaskStatus(taskId: string, userId: string, nextStatus: "in_progress" | "completed") {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== userId) {
    throw new Error("Task not found or not assigned to you");
  }
  if (ALLOWED_TRANSITIONS[task.status] !== nextStatus) {
    throw new Error(`Cannot move a task from "${task.status}" to "${nextStatus}"`);
  }
  return prisma.task.update({ where: { id: taskId }, data: { status: nextStatus } });
}
