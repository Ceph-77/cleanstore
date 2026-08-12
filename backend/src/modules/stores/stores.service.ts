import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeCreateSchema, storeUpdateSchema } from "./stores.schema";
import { geocodeAddress } from "../../utils/geocode";

type StoreCreateInput = z.infer<typeof storeCreateSchema>;
type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;

export function listStores() {
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { grandeCompagnie: true, assignedSubcontractor: true },
  });
}

export function listStoresWithCoordinates() {
  return prisma.store.findMany({
    where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    select: { id: true, name: true, banner: true, city: true, address: true, latitude: true, longitude: true },
    orderBy: { name: "asc" },
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

export async function createStore(data: StoreCreateInput, createdById: string) {
  const coords = await geocodeAddress(data.address, data.city);
  return prisma.store.create({
    data: {
      ...data,
      createdById,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    },
  });
}

export async function updateStore(id: string, data: StoreUpdateInput) {
  let coords: { latitude: number; longitude: number } | null = null;
  if (data.address !== undefined || data.city !== undefined) {
    coords = await geocodeAddress(data.address, data.city);
  }

  return prisma.store.update({
    where: { id },
    data: {
      ...data,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    },
  });
}

export function archiveStore(id: string) {
  return prisma.store.update({
    where: { id },
    data: { isActive: false },
  });
}
