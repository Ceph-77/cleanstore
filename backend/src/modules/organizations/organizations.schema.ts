import { z } from "zod";

export const organizationCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["grande_compagnie", "sous_traitant"]),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});
