import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeCreateSchema, storeUpdateSchema, storeGeofenceSchema } from "./stores.schema";
import { geocodeAddress } from "../../utils/geocode";

type StoreCreateInput = z.infer<typeof storeCreateSchema>;
type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;
type StoreGeofenceInput = z.infer<typeof storeGeofenceSchema>;

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
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          inspection: { select: { id: true, score: true } },
          assignedTo: { select: { id: true, fullName: true, email: true } },
        },
      },
      contacts: { orderBy: { createdAt: "asc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, fullName: true, email: true } } },
      },
      invoices: { orderBy: { createdAt: "desc" } },
      inspections: { orderBy: { createdAt: "desc" } },
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
  const addressChanged = data.address !== undefined || data.city !== undefined;
  if (addressChanged) {
    const current = await prisma.store.findUnique({
      where: { id },
      select: { address: true, city: true },
    });
    const nextAddress = data.address ?? current?.address ?? null;
    const nextCity = data.city ?? current?.city ?? null;
    if (nextAddress !== current?.address || nextCity !== current?.city) {
      coords = await geocodeAddress(nextAddress, nextCity);
    }
  }

  return prisma.store.update({
    where: { id },
    data: {
      ...data,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    },
  });
}

export function setStoreGeofence(id: string, data: StoreGeofenceInput) {
  const points =
    data.geofencePoints === undefined
      ? undefined
      : data.geofencePoints === null || data.geofencePoints.length === 0
        ? Prisma.JsonNull
        : (data.geofencePoints as Prisma.InputJsonValue);

  return prisma.store.update({
    where: { id },
    data: {
      geofenceLat: data.geofenceLat,
      geofenceLng: data.geofenceLng,
      geofenceRadiusM: data.geofenceRadiusM,
      ...(points === undefined ? {} : { geofencePoints: points }),
    },
  });
}

export function archiveStore(id: string) {
  return prisma.store.update({
    where: { id },
    data: { isActive: false },
  });
}
