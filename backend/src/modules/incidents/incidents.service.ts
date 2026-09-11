import { prisma } from "../../db/prisma";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";
import { holdEarningForIncident, releaseIncidentHold } from "../payments/payments.service";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@prisma/client";

const BLOCKING_SEVERITIES: IncidentSeverity[] = ["majeur", "urgence"];

const include = {
  store: { select: { id: true, name: true } },
  task: { select: { id: true, description: true } },
  reportedBy: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  notes: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { id: true, fullName: true, email: true } } } },
};

export interface CreateIncidentInput {
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  storeId?: string | null;
  taskId?: string | null;
}

/**
 * Signaler un incident — bouton toujours accessible à tout user connecté
 * (Q41-43). Majeur/urgence sur une tâche déjà complétée suspend son gain
 * immédiatement (voir payments.service holdEarningForIncident) — no-op si la
 * tâche n'a pas encore de gain. Le push qui "fait sonner le téléphone" et la
 * génération PDF restent volontairement PAS faits ici (voir schema.prisma).
 */
export async function createIncident(input: CreateIncidentInput, reportedById: string) {
  const incident = await prisma.incident.create({
    data: { ...input, reportedById },
    include,
  });
  if (input.taskId && BLOCKING_SEVERITIES.includes(input.severity)) {
    await holdEarningForIncident(input.taskId, incident.id);
  }
  return incident;
}

export async function listIncidents(page: PageParams, status?: IncidentStatus, severity?: IncidentSeverity) {
  const rows = await prisma.incident.findMany({
    where: { ...(status ? { status } : {}), ...(severity ? { severity } : {}) },
    include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
  });
  return toPage(rows, page.limit);
}

export function getIncident(id: string) {
  return prisma.incident.findUnique({ where: { id }, include });
}

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignedToId?: string | null;
}

/**
 * Un changement de statut/gravité peut poser ou lever la suspension du gain
 * lié : passer à majeur/urgence (encore ouvert) suspend ; passer à "résolue"
 * OU redescendre à "mineur" lève la suspension (voir releaseIncidentHold —
 * qui recalcule l'état naturel plutôt que de forcer "available").
 */
export async function updateIncident(id: string, input: UpdateIncidentInput) {
  const before = await prisma.incident.findUniqueOrThrow({ where: { id } });
  const incident = await prisma.incident.update({ where: { id }, data: input, include });

  const stillOpen = incident.status !== "resolue";
  const isBlocking = BLOCKING_SEVERITIES.includes(incident.severity);
  if (incident.taskId) {
    if (stillOpen && isBlocking && !BLOCKING_SEVERITIES.includes(before.severity)) {
      await holdEarningForIncident(incident.taskId, incident.id);
    } else if (!stillOpen || !isBlocking) {
      await releaseIncidentHold(incident.id);
    }
  }
  return incident;
}

export async function addNote(incidentId: string, authorId: string | null, body: string) {
  await prisma.incidentNote.create({ data: { incidentId, authorId, body } });
  return getIncident(incidentId);
}
