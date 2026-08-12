import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeCreateSchema, storeUpdateSchema } from "./stores.schema";

type StoreCreateInput = z.infer<typeof storeCreateSchema>;
type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;

export function listStores() {
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { grandeCompagnie: true, assignedSubcontractor: true },
  });
}

export function getStoreById(id: string) {
  return prisma.store.findUnique({
    where: { id },
    include: {
      grandeCompagnie: true,
      assignedSubcontractor: true,
      assignedWorker: true,
      inspectors: { include: { user: true } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });
}

export function createStore(data: StoreCreateInput, createdById: string) {
  return prisma.store.create({
    data: { ...data, createdById },
  });
}

export function updateStore(id: string, data: StoreUpdateInput) {
  return prisma.store.update({
    where: { id },
    data,
  });
}

export function archiveStore(id: string) {
  return prisma.store.update({
    where: { id },
    data: { isActive: false },
  });
}
