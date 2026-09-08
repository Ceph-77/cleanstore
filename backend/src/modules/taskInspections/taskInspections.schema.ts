import { z } from "zod";

export const taskInspectionCreateSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  notes: z.string().optional(),
  // Inspector's correction of the worker-reported metric value (recomputes pay).
  correctedMetricValue: z.coerce.number().nonnegative().optional(),
});

export const taskInspectionUpdateSchema = z
  .object({
    score: z.coerce.number().int().min(0).max(100),
    notes: z.string().nullable(),
    correctedMetricValue: z.coerce.number().nonnegative().nullable(),
  })
  .partial();
