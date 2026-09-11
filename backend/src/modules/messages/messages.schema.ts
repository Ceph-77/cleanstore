import { z } from "zod";

export const postMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const editMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const createAdhocThreadSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1),
  title: z.string().max(120).optional(),
});

export const globalThreadKindSchema = z.enum(["jazzette", "annonces"]);
