import { z } from "zod";

export const openNegotiationSchema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
  clanId: z.string().uuid().optional(),
});

export const counterOfferSchema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
});

export const acceptNegotiationSchema = z.object({
  amount: z.coerce.number().positive().optional(), // sinon = dernière offre
  note: z.string().max(500).optional(),
});

export const rejectNegotiationSchema = z.object({
  reason: z.string().max(500).optional(),
});
