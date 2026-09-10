import { z } from "zod";

export const createClaimSchema = z.object({
  note: z.string().optional(),
  /** Réserver au nom d'un clan (sinon solo). */
  clanId: z.string().uuid().optional(),
});

export const directAssignSchema = z.object({
  taskId: z.string().uuid(),
  workerId: z.string().uuid(),
});

export const claimDecisionSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    reason: z.string().optional(),
  })
  .refine((data) => data.status !== "rejected" || !!data.reason?.trim(), {
    message: "Une raison est requise pour refuser",
    path: ["reason"],
  });
