import { z } from "zod";

export const storeContactCreateSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const storeContactUpdateSchema = storeContactCreateSchema.partial();
