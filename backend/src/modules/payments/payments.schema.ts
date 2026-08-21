import { z } from "zod";

export const savePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const commissionRateUpdateSchema = z.object({
  commissionRatePercent: z.coerce.number().min(0).max(100),
});
