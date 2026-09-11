import { prisma } from "../../db/prisma";
import type { z } from "zod";
import { Prisma, type TaskStatus } from "@prisma/client";
import type { taskCreateSchema, taskUpdateSchema } from "./tasks.schema";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";
import { todayAtHour, recurrenceRunsOn, type Recurrence } from "../../utils/week";

/** Heure (locale Montréal) avant laquelle les tâches du jour ne sont pas visibles. */
const VISIBILITY_HOUR = 15;

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

/**
 * Publie une tâche. Fenêtre de 15 h : publiée AVANT 15 h -> visible seulement à
 * partir de 15 h aujourd'hui. Publiée APRÈS 15 h -> visible tout de suite ET
 * marquée « urgence » (+25 % au calcul du gain), sauf si déjà appliqué ou si la
 * tâche n'est plus `open`.
 */
export async function publishTask(id: string) {
  const now = new Date();
  const at15 = todayAtHour(VISIBILITY_HOUR, now);
  const beforeWindow = now < at15;

  const data: {
    isPublished: true;
    visibleFrom: Date;
    latePremiumApplied?: true;
  } = {
    isPublished: true,
    visibleFrom: beforeWindow ? at15 : now,
  };

  if (!beforeWindow) {
    const current = await prisma.task.findUniqueOrThrow({
      where: { id },
      select: { latePremiumApplied: true, status: true },
    });
    if (!current.latePremiumApplied && current.status === "open") {
      data.latePremiumApplied = true;
    }
  }

  return prisma.task.update({ where: { id }, data });
}

export function unpublishTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { isPublished: false },
  });
}

export async function listAllTasksForDashboard(page: PageParams, status?: TaskStatus) {
  const rows = await prisma.task.findMany({
    where: status ? { status } : { status: { notIn: ["open", "cancelled"] } },
    include: {
      store: { select: { id: true, name: true, city: true } },
      assignedTo: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
  });
  return toPage(rows, page.limit);
}

/**
 * Refuse la suppression d'une tâche qui porte un historique réel — la paie
 * (`WorkerEarning`, de toute façon bloquée en base par ON DELETE RESTRICT,
 * vérifié ici pour un message clair plutôt qu'une erreur SQL brute),
 * l'inspection, les candidatures, une négociation de prix ou une conversation
 * avec des messages. Ces 5 tables sont en CASCADE sur `task_id` (sauf
 * WorkerEarning en RESTRICT) — sans ce garde-fou, `prisma.task.delete()` les
 * effacerait silencieusement, ce qui casserait la règle « argent, dates et
 * qui-a-fait-quoi ne se perdent jamais ». Les points/moments/incidents/écritures
 * du grand livre liés à la tâche sont en SET NULL (conçus pour survivre à une
 * tâche supprimée) et ne bloquent donc jamais ici — les flammes de série ne
 * lisent que `PointEntry.createdAt`, jamais la tâche elle-même.
 */
export async function deleteTask(id: string) {
  const [earnings, inspection, claims, negotiations, thread] = await Promise.all([
    prisma.workerEarning.count({ where: { taskId: id } }),
    prisma.taskInspection.findUnique({ where: { taskId: id }, select: { id: true } }),
    prisma.taskClaim.count({ where: { taskId: id } }),
    prisma.taskNegotiation.count({ where: { taskId: id } }),
    prisma.messageThread.findUnique({
      where: { taskId: id },
      select: { _count: { select: { messages: true } } },
    }),
  ]);

  if (earnings > 0) {
    throw new Error("Cette tâche a un gain associé (paie) — impossible de la supprimer.");
  }
  if (inspection) {
    throw new Error("Cette tâche a déjà été inspectée — impossible de la supprimer (historique d'inspection).");
  }
  if (claims > 0) {
    throw new Error("Cette tâche a des candidatures associées — impossible de la supprimer.");
  }
  if (negotiations > 0) {
    throw new Error("Cette tâche a un historique de négociation de prix — impossible de la supprimer.");
  }
  if (thread && thread._count.messages > 0) {
    throw new Error("Cette tâche a une conversation associée — impossible de la supprimer.");
  }

  return prisma.task.delete({ where: { id } });
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Génération quotidienne des tâches récurrentes. Idempotente par jour
 * (`lastRecurredOn`). Pour chaque tâche récurrente d'un magasin :
 *  - les instances de la veille jamais réservées passent en `cancelled`
 *    (trace conservée : jour, magasin, lien vers la récurrente parente) ;
 *  - une nouvelle instance `open` du jour est créée, visible à partir de 15 h.
 * Les non-récurrentes non réservées ne sont pas touchées (elles s'accumulent).
 */
export async function runDueRecurrences() {
  const today = startOfToday();
  const visibleFrom = todayAtHour(VISIBILITY_HOUR);
  const parents = await prisma.task.findMany({
    where: {
      isRecurring: true,
      OR: [{ lastRecurredOn: null }, { lastRecurredOn: { lt: today } }],
      store: { isActive: true, recurrencePaused: false },
    },
  });

  let created = 0;
  let cancelled = 0;
  let skipped = 0;
  for (const parent of parents) {
    const explicitSkip =
      parent.recurrenceSkipDate != null &&
      parent.recurrenceSkipDate.getTime() === today.getTime();
    // Motif de récurrence : jour non concerné -> on ne crée rien et on ne marque
    // pas lastRecurredOn (on re-vérifiera au prochain passage du cron).
    const patternSkip = !recurrenceRunsOn(parent.recurrence as Recurrence);
    const skipToday = explicitSkip || patternSkip;

    const c = await prisma.$transaction(async (tx) => {
      const cancel = await tx.task.updateMany({
        where: {
          recurringParentId: parent.id,
          status: "open",
          assignedToId: null,
          dueDate: { lt: today },
        },
        data: { status: "cancelled" },
      });

      if (skipToday) {
        if (explicitSkip) {
          // Jour explicitement sauté par l'admin : consomme le drapeau + marque le jour.
          await tx.task.update({
            where: { id: parent.id },
            data: { lastRecurredOn: today, recurrenceSkipDate: null },
          });
        }
        return { cancelled: cancel.count, skipped: true };
      }

      await tx.task.create({
        data: {
          storeId: parent.storeId,
          recurringParentId: parent.id,
          description: parent.description,
          taskType: parent.taskType,
          price: parent.price,
          isNegotiable: parent.isNegotiable,
          isPublished: parent.isPublished,
          visibleFrom,
          dueDate: today,
          status: "open",
          expectedResultText: parent.expectedResultText,
          howToText: parent.howToText,
          requiredEquipment: parent.requiredEquipment,
          estimatedDurationMinutes: parent.estimatedDurationMinutes,
          templateId: parent.templateId,
          metricLabel: parent.metricLabel,
          metricUnit: parent.metricUnit,
          metricTarget: parent.metricTarget,
          paymentMode: parent.paymentMode,
          hourlyRate: parent.hourlyRate,
          hourlyCapMinutes: parent.hourlyCapMinutes,
          unitPrice: parent.unitPrice,
          unitLabel: parent.unitLabel,
          requiresOdometer: parent.requiresOdometer,
          category: parent.category,
          timeWindowStart: parent.timeWindowStart,
          timeWindowEnd: parent.timeWindowEnd,
          requiresStartPhoto: parent.requiresStartPhoto,
          requiresEndPhoto: parent.requiresEndPhoto,
          recurrence:
            parent.recurrence == null ? undefined : (parent.recurrence as Prisma.InputJsonValue),
          consumables:
            parent.consumables == null
              ? undefined
              : (parent.consumables as Prisma.InputJsonValue),
          reservableBy: parent.reservableBy,
          minClanSize: parent.minClanSize,
          isRecurring: false,
          createdById: parent.createdById,
        },
      });
      await tx.task.update({ where: { id: parent.id }, data: { lastRecurredOn: today } });
      return { cancelled: cancel.count, skipped: false };
    });
    cancelled += c.cancelled;
    if (c.skipped) skipped += 1;
    else created += 1;
  }

  return { created, cancelled, skipped };
}

/** Tâches récurrentes (tous magasins) + instance du jour, pour la vue « Récurrences ». */
export async function listRecurrences() {
  const today = startOfToday();
  const parents = await prisma.task.findMany({
    where: { isRecurring: true },
    orderBy: [{ storeId: "asc" }, { description: "asc" }],
    select: {
      id: true,
      description: true,
      taskType: true,
      price: true,
      isPublished: true,
      recurrenceSkipDate: true,
      lastRecurredOn: true,
      store: { select: { id: true, name: true, city: true, recurrencePaused: true, isActive: true } },
      recurringInstances: {
        where: { dueDate: today },
        select: { id: true, status: true, price: true, assignedToId: true, visibleFrom: true },
        take: 1,
      },
    },
  });
  return parents.map((p) => {
    const { recurringInstances, ...rest } = p;
    return { ...rest, todayInstance: recurringInstances[0] ?? null };
  });
}

/** Sauter la génération d'aujourd'hui pour une tâche récurrente. Annule aussi l'instance du jour si déjà créée et libre. */
export async function skipRecurrenceToday(parentId: string, skip: boolean) {
  const today = startOfToday();
  const parent = await prisma.task.findUniqueOrThrow({
    where: { id: parentId },
    select: { isRecurring: true },
  });
  if (!parent.isRecurring) throw new Error("Cette tâche n'est pas récurrente.");

  return prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: parentId },
      data: { recurrenceSkipDate: skip ? today : null },
    });
    if (skip) {
      await tx.task.updateMany({
        where: { recurringParentId: parentId, dueDate: today, status: "open", assignedToId: null },
        data: { status: "cancelled" },
      });
    }
    return tx.task.findUniqueOrThrow({ where: { id: parentId } });
  });
}

export async function setStoreRecurrencePaused(storeId: string, paused: boolean) {
  return prisma.store.update({ where: { id: storeId }, data: { recurrencePaused: paused } });
}
