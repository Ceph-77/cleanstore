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

export function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
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
  });
}

interface UserAdminPatch {
  isActive?: boolean;
  fullName?: string;
  phone?: string | null;
  role?: RoleKey;
  organizationId?: string | null;
}

export async function updateUserAdmin(id: string, patch: UserAdminPatch) {
  return prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (patch.isActive !== undefined) data.isActive = patch.isActive;
    if (patch.fullName !== undefined) data.fullName = patch.fullName;
    if (patch.phone !== undefined) data.phone = patch.phone;
    if (Object.keys(data).length > 0) {
      await tx.user.update({ where: { id }, data });
    }

    if (patch.role !== undefined) {
      const role = await tx.role.findUniqueOrThrow({ where: { key: patch.role } });
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.create({
        data: {
          userId: id,
          roleId: role.id,
          organizationId: patch.role === "sous_traitant" ? patch.organizationId ?? undefined : undefined,
        },
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        roles: {
          select: {
            role: { select: { key: true, label: true } },
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });
  });
}

/**
 * Hard-delete a user. Cascades (roles, inspectors, reset tokens, point entries,
 * moments) and set-nulls (authored notes/docs, assigned/created stores & tasks,
 * feedback) are handled by the schema. TaskClaim / StoreClaim are required
 * relations with no cascade, so remove them explicitly. Refuses if the user has
 * any financial history — deactivate those instead.
 */
export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!user) throw new Error("Utilisateur introuvable.");

  const [earnings, withdrawals] = await Promise.all([
    prisma.workerEarning.count({ where: { workerId: id } }),
    prisma.withdrawal.count({ where: { workerId: id } }),
  ]);
  if (earnings > 0 || withdrawals > 0) {
    throw new Error(
      "Cet utilisateur a un historique financier (gains ou retraits). Désactivez-le au lieu de le supprimer."
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.taskClaim.deleteMany({ where: { workerId: id } });
    await tx.storeClaim.deleteMany({ where: { requestedById: id } });
    return tx.user.delete({ where: { id }, select: { id: true, email: true } });
  });
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
