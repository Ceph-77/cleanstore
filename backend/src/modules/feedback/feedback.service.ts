import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { feedbackCreateSchema, feedbackUpdateSchema } from "./feedback.schema";
import type { IncidentSeverity, IncidentType } from "@prisma/client";

type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;
type FeedbackUpdateInput = z.infer<typeof feedbackUpdateSchema>;

const userSelect = {
  id: true,
  fullName: true,
  email: true,
} as const;

const include = {
  user: { select: userSelect },
  assignedTo: { select: userSelect },
  convertedIncident: { select: { id: true, status: true } },
};

export function listFeedback() {
  return prisma.feedback.findMany({
    orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
    include,
  });
}

export function createFeedback(data: FeedbackCreateInput, userId: string, role: string | null) {
  return prisma.feedback.create({
    data: { ...data, userId, role: role ?? undefined },
    include,
  });
}

export function updateFeedback(id: string, data: FeedbackUpdateInput) {
  return prisma.feedback.update({ where: { id }, data, include });
}

export function deleteFeedback(id: string) {
  return prisma.feedback.delete({ where: { id } });
}

/**
 * Transforme un feedback en incident traçable (Q53 : "Convertir en
 * incident"). Le feedback original reste — on le lie juste et on le passe
 * "en_traitement" pour qu'il ne traîne pas comme non-lu.
 */
export async function convertToIncident(id: string, type: IncidentType, severity: IncidentSeverity) {
  const feedback = await prisma.feedback.findUniqueOrThrow({ where: { id } });
  if (feedback.convertedIncidentId) {
    throw new Error("Ce feedback est déjà lié à un incident.");
  }
  const incident = await prisma.incident.create({
    data: { type, severity, description: feedback.note, reportedById: feedback.userId },
  });
  return prisma.feedback.update({
    where: { id },
    data: { convertedIncidentId: incident.id, status: "en_traitement" },
    include,
  });
}
