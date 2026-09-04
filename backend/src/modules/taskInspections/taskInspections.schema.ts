import { z } from "zod";

export const taskInspectionCreateSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  notes: z.string().optional(),
});

export const taskInspectionUpdateSchema = z
  .object({
    score: z.coerce.number().int().min(0).max(100),
    notes: z.string().nullable(),
  })
  .partial();
