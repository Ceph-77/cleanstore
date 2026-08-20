import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { TaskStatus } from "@prisma/client";
import type { taskCreateSchema, taskUpdateSchema } from "./tasks.schema";

type TaskCreateInput = z.infer<typeof taskCreateSchema>;
type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export function listTasksForStore(storeId: string) {
  return prisma.task.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { id: true, fullName: true, email: true } } },
  });
}

export function createTask(storeId: string, data: TaskCreateInput, createdById: string) {
  return prisma.task.create({
    data: { ...data, storeId, createdById },
  });
}

export function updateTask(id: string, data: TaskUpdateInput) {
  return prisma.task.update({
    where: { id },
    data,
  });
}

export function publishTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { isPublished: true },
  });
}

export function unpublishTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { isPublished: false },
  });
}

export function listAllTasksForDashboard(status?: TaskStatus) {
  return prisma.task.findMany({
    where: status ? { status } : { status: { notIn: ["open", "cancelled"] } },
    include: {
      store: { select: { id: true, name: true, city: true } },
      assignedTo: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function runDueRecurrences() {
  const today = startOfToday();
  const templates = await prisma.task.findMany({
    where: {
      isRecurring: true,
      OR: [{ lastRecurredOn: null }, { lastRecurredOn: { lt: today } }],
    },
  });

  let created = 0;
  for (const template of templates) {
    await prisma.$transaction([
      prisma.task.create({
        data: {
          storeId: template.storeId,
          description: template.description,
          taskType: template.taskType,
          price: template.price,
          isNegotiable: template.isNegotiable,
          isPublished: template.isPublished,
          dueDate: today,
          status: "open",
          assignedToId: null,
          workerNote: null,
          expectedResultText: template.expectedResultText,
          howToText: template.howToText,
          requiredEquipment: template.requiredEquipment,
          estimatedDurationMinutes: template.estimatedDurationMinutes,
          startedAt: null,
          isRecurring: false,
          createdById: template.createdById,
        },
      }),
      prisma.task.update({
        where: { id: template.id },
        data: { lastRecurredOn: today },
      }),
    ]);
    created += 1;
  }

  return created;
}
