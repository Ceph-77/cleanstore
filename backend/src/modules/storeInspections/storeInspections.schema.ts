import { z } from "zod";

export const checklistItemSchema = z.object({
  zone: z.string().min(1),
  item: z.string().min(1),
  passed: z.boolean(),
});

export const storeInspectionCreateSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  notes: z.string().optional(),
  checklist: z.array(checklistItemSchema).default([]),
});
