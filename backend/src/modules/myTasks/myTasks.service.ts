import { prisma } from "../../db/prisma";
import { getInspectionWithUrls } from "../taskInspections/taskInspections.service";
import { getSignedDownloadUrl } from "../../utils/storage";
import { createEarningForCompletedTask } from "../payments/payments.service";
import {
  haversineMeters,
  DEFAULT_START_RADIUS_M,
  FALLBACK_START_RADIUS_M,
} from "../../utils/geo";
import type { TaskStatus, Prisma } from "@prisma/client";

const ALLOWED_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus>> = {
  claimed: "in_progress",
  in_progress: "completed",
};

export interface WorkerPosition {
  lat?: number;
  lng?: number;
  accuracy?: number;
}

type GeofenceStore = {
  geofenceLat: Prisma.Decimal | null;
  geofenceLng: Prisma.Decimal | null;
  geofenceRadiusM: number | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
};

/**
 * A worker can only start a task while physically near the store. Reference point
 * is the on-site walked geofence when available, otherwise the address-geocoded
 * coordinates (with a wider radius to absorb geocoding imprecision).
 */
function assertWorkerAtStore(store: GeofenceStore, pos: WorkerPosition | undefined) {
  let ref: { lat: number; lng: number } | null = null;
  let radius = DEFAULT_START_RADIUS_M;

  if (store.geofenceLat != null && store.geofenceLng != null) {
    ref = { lat: store.geofenceLat.toNumber(), lng: store.geofenceLng.toNumber() };
    radius = store.geofenceRadiusM ?? DEFAULT_START_RADIUS_M;
  } else if (store.latitude != null && store.longitude != null) {
    ref = { lat: store.latitude.toNumber(), lng: store.longitude.toNumber() };
    radius = store.geofenceRadiusM ?? FALLBACK_START_RADIUS_M;
  }

  if (!ref) {
    throw new Error(
      "Ce magasin n'a pas d'emplacement GPS enregistré. Contactez un administrateur pour l'ajouter."
    );
  }

  if (pos?.lat == null || pos?.lng == null || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) {
    throw new Error("Activez la localisation pour démarrer la tâche.");
  }

  const distance = haversineMeters(ref, { lat: pos.lat, lng: pos.lng });
  const tolerance = Number.isFinite(pos.accuracy ?? NaN) ? Math.max(0, pos.accuracy as number) : 0;
  if (distance - tolerance > radius) {
    throw new Error(
      `Vous êtes à environ ${Math.round(distance)} m du magasin. ` +
        `Rapprochez-vous à moins de ${radius} m pour démarrer la tâche.`
    );
  }
}

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
  note: string | undefined,
  position?: WorkerPosition
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      store: {
        select: {
          geofenceLat: true,
          geofenceLng: true,
          geofenceRadiusM: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
  if (!task || task.assignedToId !== userId) {
    throw new Error("Task not found or not assigned to you");
  }
  if (ALLOWED_TRANSITIONS[task.status] !== nextStatus) {
    throw new Error(`Cannot move a task from "${task.status}" to "${nextStatus}"`);
  }

  if (nextStatus === "in_progress") {
    assertWorkerAtStore(task.store, position);
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
