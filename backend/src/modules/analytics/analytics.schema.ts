import { z } from "zod";

const propValue = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);

export const trackEventSchema = z.object({
  name: z.string().min(1).max(80),
  sessionId: z.string().max(64).optional(),
  path: z.string().max(200).optional(),
  props: z.record(propValue).optional(),
});

/** The client sends a small batch (flushed on a timer / page hide). */
export const trackBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(50),
});

export const analyticsQuerySchema = z.object({
  /** Look-back window in days (default 30, max 365). */
  days: z.coerce.number().int().min(1).max(365).default(30),
});
