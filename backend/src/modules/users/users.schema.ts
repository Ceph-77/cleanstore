import { z } from "zod";

export const userRoleKeyEnum = z.enum(["sous_traitant", "travailleur"]);

export const userCreateSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1),
    phone: z.string().optional(),
    role: userRoleKeyEnum,
    organizationId: z.string().uuid().optional(),
  })
  .refine((data) => data.role !== "sous_traitant" || !!data.organizationId, {
    message: "organizationId is required for role sous_traitant",
    path: ["organizationId"],
  });
