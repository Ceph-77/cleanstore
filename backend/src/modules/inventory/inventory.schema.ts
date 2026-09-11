import { z } from "zod";

export const inventoryKindEnum = z.enum(["consommable", "produit_chimique", "gaz", "machine"]);

export const inventoryItemCreateSchema = z.object({
  kind: inventoryKindEnum,
  name: z.string().min(1).max(120),
  unit: z.string().max(20).nullable().optional(),
  quantity: z.coerce.number().nonnegative().optional(),
  lowThreshold: z.coerce.number().nonnegative().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  odometer: z.coerce.number().nonnegative().nullable().optional(),
  lastServiceAt: z.coerce.date().nullable().optional(),
  nextServiceAt: z.coerce.date().nullable().optional(),
  condition: z.string().max(40).nullable().optional(),
});

export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const restockSchema = z.object({
  qty: z.coerce.number(), // positif = réappro, négatif = correction à la baisse
  reason: z.string().max(120).optional(),
});
