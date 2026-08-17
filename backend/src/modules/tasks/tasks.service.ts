import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { taskCreateSchema, taskUpdateSchema } from "./tasks.schema";

type TaskCreateInput = z.infer<typeof taskCreateSchema>;
type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export function listTasksForStore(storeId: string) {
  return prisma.task.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
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

export function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}
