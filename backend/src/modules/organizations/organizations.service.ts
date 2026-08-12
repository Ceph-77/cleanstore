import { prisma } from "../../db/prisma";
import type { OrganizationType } from "@prisma/client";
import type { z } from "zod";
import type { organizationCreateSchema } from "./organizations.schema";

type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;

export function listOrganizations(type?: OrganizationType) {
  return prisma.organization.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
}

export function createOrganization(data: OrganizationCreateInput) {
  return prisma.organization.create({ data });
}
