import { z } from "zod";

export const incidentTypeEnum = z.enum(["blessure", "degat", "vol", "incendie", "sante", "autre"]);
export const incidentSeverityEnum = z.enum(["mineur", "majeur", "urgence"]);
export const incidentStatusEnum = z.enum(["ouverte", "en_traitement", "resolue"]);

export const createIncidentSchema = z.object({
  type: incidentTypeEnum,
  severity: incidentSeverityEnum,
  description: z.string().trim().min(1).max(2000),
  storeId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
});

export const updateIncidentSchema = z.object({
  status: incidentStatusEnum.optional(),
  severity: incidentSeverityEnum.optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});

export const addIncidentNoteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
