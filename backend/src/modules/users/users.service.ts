import { prisma } from "../../db/prisma";
import type { RoleKey } from "@prisma/client";

export function listUsersByRole(role?: RoleKey) {
  return prisma.user.findMany({
    where: role
      ? {
          roles: { some: { role: { key: role } } },
        }
      : undefined,
    select: { id: true, fullName: true, email: true, phone: true },
    orderBy: { fullName: "asc" },
  });
}
