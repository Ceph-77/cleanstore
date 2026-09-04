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

export const userUpdateSchema = z
  .object({
    isActive: z.boolean(),
    fullName: z.string().min(1),
    phone: z.string().nullable(),
    role: userRoleKeyEnum,
    organizationId: z.string().uuid().nullable(),
  })
  .partial()
  .refine((d) => d.role !== "sous_traitant" || !!d.organizationId, {
    message: "organizationId requis pour le rôle sous_traitant",
    path: ["organizationId"],
  });
