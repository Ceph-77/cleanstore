import { z } from "zod";

export const createClaimSchema = z.object({
  note: z.string().optional(),
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
