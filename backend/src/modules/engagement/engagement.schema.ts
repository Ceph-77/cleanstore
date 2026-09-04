import { z } from "zod";

export const pastTaskSchema = z.object({
  storeId: z.string().uuid(),
  description: z.string().min(1),
  taskType: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  completedAt: z.coerce.date(),
  inspectionScore: z.coerce.number().int().min(0).max(100).optional(),
});

export const pastTaskUpdateSchema = z
  .object({
    description: z.string().min(1),
    taskType: z.string().nullable(),
    price: z.coerce.number().nonnegative(),
    completedAt: z.coerce.date(),
    inspectionScore: z.coerce.number().int().min(0).max(100).nullable(),
  })
  .partial();
