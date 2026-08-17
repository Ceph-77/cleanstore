import { z } from "zod";

export const claimDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
