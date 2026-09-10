import { z } from "zod";

export const templateCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1),
  taskType: z.string().optional(),
  defaultPrice: z.coerce.number().nonnegative().nullable().optional(),
  isNegotiable: z.boolean().optional(),
  isRecurringDefault: z.boolean().optional(),
  expectedResultText: z.string().optional(),
  howToText: z.string().optional(),
  requiredEquipment: z.array(z.string()).optional(),
  estimatedDurationMinutes: z.coerce.number().int().positive().nullable().optional(),
  metricLabel: z.string().max(80).nullable().optional(),
  metricUnit: z.string().max(24).nullable().optional(),
  defaultMetricTarget: z.coerce.number().positive().nullable().optional(),
  paymentMode: z.enum(["fixed", "hourly", "per_unit", "metric_prorata"]).optional(),
  hourlyRate: z.coerce.number().positive().nullable().optional(),
  hourlyCapMinutes: z.coerce.number().int().positive().nullable().optional(),
  unitPrice: z.coerce.number().positive().nullable().optional(),
  unitLabel: z.string().max(40).nullable().optional(),
  requiresOdometer: z.boolean().optional(),
  isActive: z.boolean().optional(),
  steps: z.array(z.string().min(1)).optional(),
});

export const templateUpdateSchema = templateCreateSchema.partial();

/** Create one task per template id on a store (unpublished, status open). */
export const instantiateSchema = z.object({
  storeId: z.string().uuid(),
  templateIds: z.array(z.string().uuid()).min(1).max(50),
});
