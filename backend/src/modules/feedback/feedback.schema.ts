import { z } from "zod";

export const feedbackCreateSchema = z.object({
  selector: z.string().min(1),
  context: z.string().min(1),
  section: z.string().min(1),
  note: z.string().min(1),
  isMulti: z.boolean().optional().default(false),
});

export const feedbackStatusEnum = z.enum(["non_lu", "lu", "en_traitement", "resolu", "ignore"]);

export const feedbackUpdateSchema = z.object({
  status: feedbackStatusEnum.optional(),
  isImportant: z.boolean().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  assignedCategory: z.string().max(60).nullable().optional(),
});

export const convertToIncidentSchema = z.object({
  type: z.enum(["blessure", "degat", "vol", "incendie", "sante", "autre"]).default("autre"),
  severity: z.enum(["mineur", "majeur", "urgence"]).default("mineur"),
});
