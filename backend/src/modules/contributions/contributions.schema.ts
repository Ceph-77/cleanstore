import { z } from "zod";

export const createContributionSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(4000),
  category: z.string().max(60).optional(),
});

export const contributionStatusEnum = z.enum(["soumise", "a_l_etude", "adoptee", "rejetee"]);

export const decideContributionSchema = z.object({
  status: contributionStatusEnum,
  decisionNote: z.string().max(2000).optional(),
  pointsAwarded: z.coerce.number().int().min(0).max(2000).optional(),
});
