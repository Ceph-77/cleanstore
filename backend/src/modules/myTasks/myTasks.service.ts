import { prisma } from "../../db/prisma";
import { getInspectionWithUrls } from "../taskInspections/taskInspections.service";
import { getSignedDownloadUrl } from "../../utils/storage";
import { createEarningForCompletedTask } from "../payments/payments.service";
import { decrementForCompletedTask } from "../inventory/inventory.service";
import {
  haversineMeters,
  DEFAULT_START_RADIUS_M,
  FALLBACK_START_RADIUS_M,
} from "../../utils/geo";
import * as engagement from "../engagement/engagement.service";
import type { TaskStatus, Prisma } from "@prisma/client";

/** The only worker-driven status moves. Each status has at most one legal next step. */
export const ALLOWED_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus>> = {
  claimed: "in_progress",
  in_progress: "completed",
};

/** Whether a worker may move a task from `from` to `to`. */
export function isAllowedTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TRANSITIONS[from] === to;
}

export interface WorkerPosition {
  lat?: number;
  lng?: number;
  accuracy?: number;
}

export type GeofenceStore = {
  geofenceLat: Prisma.Decimal | null;
  geofenceLng: Prisma.Decimal | null;
  geofenceRadiusM: number | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
};

/**
 * Records where the worker was when they started, for quality/assurance — but
 * never blocks the start. GPS on mobile (indoors, in a mall) is unreliable, and a
 * hard geo-gate on the "start" action reads as time-clock control (a labour-law
 * subordination signal). Returns a short note only when something is off.
 */
export function evaluateStartLocation(
  store: GeofenceStore,
  pos: WorkerPosition | undefined
): string | null {
  let ref: { lat: number; lng: number } | null = null;
  let radius = DEFAULT_START_RADIUS_M;

  if (store.geofenceLat != null && store.geofenceLng != null) {
    ref = { lat: store.geofenceLat.toNumber(), lng: store.geofenceLng.toNumber() };
    radius = store.geofenceRadiusM ?? DEFAULT_START_RADIUS_M;
  } else if (store.latitude != null && store.longitude != null) {
    ref = { lat: store.latitude.toNumber(), lng: store.longitude.toNumber() };
    radius = store.geofenceRadiusM ?? FALLBACK_START_RADIUS_M;
  }

  if (!ref) return "Aucun emplacement GPS enregistré pour ce magasin.";

  if (pos?.lat == null || pos?.lng == null || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) {
    return "Position non fournie au démarrage.";
  }

  const distance = haversineMeters(ref, { lat: pos.lat, lng: pos.lng });
  const tolerance = Number.isFinite(pos.accuracy ?? NaN) ? Math.max(0, pos.accuracy as number) : 0;
  if (distance - tolerance > radius) {
    return `Démarrage à ~${Math.round(distance)} m du magasin (repère ${radius} m).`;
  }
  return null;
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

export interface StatusUpdateOpts {
  note?: string;
  position?: WorkerPosition;
  reportedMetricValue?: number;
  reportedUnits?: number;
  /** Relevé du compteur au démarrage (tâches à odomètre). */
  startOdometer?: number;
  /** Relevé du compteur à la complétion (tâches à odomètre). */
  endOdometer?: number;
}

export async function updateMyTaskStatus(
  taskId: string,
  userId: string,
  nextStatus: "in_progress" | "completed",
  opts: StatusUpdateOpts = {}
) {
  const { note, position, reportedUnits } = opts;
  let { reportedMetricValue } = opts;

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
  if (!isAllowedTransition(task.status, nextStatus)) {
    throw new Error(`Cannot move a task from "${task.status}" to "${nextStatus}"`);
  }

  const starting = nextStatus === "in_progress";
  const completing = nextStatus === "completed";

  // --- Compteur (odomètre) au démarrage et à la complétion ---
  let startOdometer: number | undefined;
  let endOdometer: number | undefined;
  if (task.requiresOdometer && starting) {
    if (opts.startOdometer == null || !Number.isFinite(opts.startOdometer) || opts.startOdometer < 0) {
      throw new Error("Relève le compteur de la machine avant de démarrer.");
    }
    startOdometer = opts.startOdometer;
  }
  if (task.requiresOdometer && completing) {
    if (opts.endOdometer == null || !Number.isFinite(opts.endOdometer) || opts.endOdometer < 0) {
      throw new Error("Relève le compteur de la machine avant de marquer cette tâche complétée.");
    }
    const start = task.startOdometer != null ? Number(task.startOdometer) : null;
    if (start == null) {
      throw new Error("Aucun relevé de compteur au démarrage : impossible de calculer la distance.");
    }
    if (opts.endOdometer <= start) {
      throw new Error("Le compteur de fin doit être supérieur au compteur de départ.");
    }
    endOdometer = opts.endOdometer;
    // Le « réalisé » du prorata est la distance parcourue, pas une saisie manuelle.
    reportedMetricValue = endOdometer - start;
  }

  // Une tâche à cible de performance (sans odomètre) exige une valeur saisie.
  const hasTarget = completing && task.metricTarget != null && !task.requiresOdometer;
  if (hasTarget && (reportedMetricValue == null || !Number.isFinite(reportedMetricValue))) {
    const unit = task.metricUnit ? ` (${task.metricUnit})` : "";
    throw new Error(
      `Saisis « ${task.metricLabel ?? "la valeur réalisée"} »${unit} avant de marquer cette tâche complétée.`
    );
  }
  const storeMetric = completing && task.metricTarget != null && reportedMetricValue != null;

  // Paiement à l'unité : le nombre réalisé est obligatoire à la complétion.
  const needsUnits = completing && task.paymentMode === "per_unit";
  if (needsUnits && (reportedUnits == null || !Number.isFinite(reportedUnits) || reportedUnits < 0)) {
    const label = task.unitLabel ?? "le nombre réalisé";
    throw new Error(`Saisis « ${label} » avant de marquer cette tâche complétée.`);
  }

  // Paiement à l'heure : on fige les minutes travaillées (Démarrer -> Complétée).
  let workedMinutes: number | undefined;
  if (completing && task.paymentMode === "hourly" && task.startedAt) {
    workedMinutes = Math.max(0, Math.round((Date.now() - task.startedAt.getTime()) / 60000));
  }

  const startGeoNote = starting ? evaluateStartLocation(task.store, position) : undefined;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: nextStatus,
      ...(starting ? { startedAt: new Date(), startGeoNote } : {}),
      ...(note !== undefined ? { workerNote: note } : {}),
      ...(startOdometer !== undefined ? { startOdometer } : {}),
      ...(endOdometer !== undefined ? { endOdometer } : {}),
      ...(storeMetric ? { reportedMetricValue, metricValueSource: "worker" } : {}),
      ...(needsUnits ? { reportedUnits } : {}),
      ...(workedMinutes !== undefined ? { workedMinutes } : {}),
    },
  });

  if (nextStatus === "completed") {
    await createEarningForCompletedTask(taskId);
    void decrementForCompletedTask(taskId, task.storeId, task.consumables);
  }

  // Engagement moments — never let them break the core task flow.
  if (nextStatus === "in_progress") {
    void engagement.onTaskStarted(updated).catch(() => {});
  } else if (nextStatus === "completed") {
    void engagement.onTaskCompleted(updated).catch(() => {});
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
