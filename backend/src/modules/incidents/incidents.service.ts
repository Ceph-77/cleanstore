import { prisma } from "../../db/prisma";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@prisma/client";

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
 * (Q41-43). Le blocage du gain sur urgence/majeur et le push qui "fait
 * sonner le téléphone" sont volontairement PAS faits ici (voir schema.prisma).
 */
export function createIncident(input: CreateIncidentInput, reportedById: string) {
  return prisma.incident.create({
    data: { ...input, reportedById },
    include,
  });
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

export function updateIncident(id: string, input: UpdateIncidentInput) {
  return prisma.incident.update({ where: { id }, data: input, include });
}

export async function addNote(incidentId: string, authorId: string | null, body: string) {
  await prisma.incidentNote.create({ data: { incidentId, authorId, body } });
  return getIncident(incidentId);
}
