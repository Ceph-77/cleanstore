import { z } from "zod";

/** Les 4 crans permis (Q8-18) — pas un pourcentage libre. */
export const SHARE_PERCENTS = [25, 50, 75, 85] as const;

export const createShareClaimSchema = z.object({
  percent: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(85)]),
  note: z.string().max(1000).optional(),
  completedStepIds: z.array(z.string().uuid()).optional().default([]),
});

export const decideShareClaimSchema = z.object({
  decision: z.enum(["accepted", "refused"]),
  decisionNote: z.string().max(1000).optional(),
});

export const inspectorAwardSchema = z.object({
  percent: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(85)]),
  decisionNote: z.string().max(1000).optional(),
});
