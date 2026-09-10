import { z } from "zod";

export const createClanSchema = z.object({ name: z.string().min(2).max(60) });
export const joinClanSchema = z.object({ code: z.string().min(4).max(12) });
export const inviteSchema = z.object({ email: z.string().email() });
