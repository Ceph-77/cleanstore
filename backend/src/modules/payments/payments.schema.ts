import { z } from "zod";

export const savePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const commissionRateUpdateSchema = z.object({
  commissionRatePercent: z.coerce.number().min(0).max(100),
});

export const earningAdjustmentSchema = z
  .object({
    taskId: z.string().uuid(),
    kind: z.enum(["penalite", "prime"]),
    percent: z.coerce.number().positive().max(100).optional(),
    amount: z.coerce.number().positive().optional(),
    reason: z.string().trim().min(1).max(500),
    workerId: z.string().uuid().optional(),
  })
  .refine((d) => d.percent != null || d.amount != null, {
    message: "Indique un pourcentage ou un montant.",
    path: ["percent"],
  });
