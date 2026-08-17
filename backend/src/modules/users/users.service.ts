import { prisma } from "../../db/prisma";
import type { RoleKey } from "@prisma/client";
import type { z } from "zod";
import type { userCreateSchema } from "./users.schema";
import { hashPassword } from "../../utils/password";

type UserCreateInput = z.infer<typeof userCreateSchema>;

export function listUsersByRole(role?: RoleKey) {
  return prisma.user.findMany({
    where: role
      ? {
          roles: { some: { role: { key: role } } },
        }
      : undefined,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      roles: {
        select: {
          role: { select: { key: true, label: true } },
          organization: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: UserCreateInput) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: data.role } });
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      roles: {
        create: {
          roleId: role.id,
          organizationId: data.organizationId,
        },
      },
    },
    include: { roles: { include: { role: true, organization: true } } },
  });

  return user;
}
