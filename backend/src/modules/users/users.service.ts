import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { Prisma, type RoleKey } from "@prisma/client";
import type { z } from "zod";
import type { userCreateSchema } from "./users.schema";
import { hashPassword } from "../../utils/password";
import { getSignedDownloadUrl, uploadFile, deleteFile } from "../../utils/storage";

const userDetailSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  address: true,
  adminNote: true,
  availability: true,
  avatarKey: true,
  isActive: true,
  createdAt: true,
  roles: {
    select: {
      role: { select: { key: true, label: true } },
      organization: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.UserSelect;

async function withAvatarUrl<T extends { avatarKey: string | null }>(user: T) {
  const { avatarKey, ...rest } = user;
  return { ...rest, avatarUrl: avatarKey ? await getSignedDownloadUrl(avatarKey).catch(() => null) : null };
}

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

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userDetailSelect });
  return user ? withAvatarUrl(user) : null;
}

export async function setUserAvatar(id: string, file: { buffer: Buffer; mimetype: string; originalname: string }) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { avatarKey: true } });
  const key = `users/${id}/avatar-${randomUUID()}`;
  await uploadFile(key, file.buffer, file.mimetype);
  const user = await prisma.user.update({ where: { id }, data: { avatarKey: key }, select: userDetailSelect });
  if (existing?.avatarKey) await deleteFile(existing.avatarKey).catch(() => {});
  return withAvatarUrl(user);
}

interface UserAdminPatch {
  isActive?: boolean;
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  adminNote?: string | null;
  availability?: { days: number[]; note?: string } | null;
  role?: RoleKey;
  organizationId?: string | null;
}

export async function updateUserAdmin(id: string, patch: UserAdminPatch) {
  const user = await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (patch.isActive !== undefined) data.isActive = patch.isActive;
    if (patch.fullName !== undefined) data.fullName = patch.fullName;
    if (patch.phone !== undefined) data.phone = patch.phone;
    if (patch.address !== undefined) data.address = patch.address;
    if (patch.adminNote !== undefined) data.adminNote = patch.adminNote;
    if (patch.availability !== undefined) {
      data.availability = patch.availability === null ? Prisma.JsonNull : patch.availability;
    }
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

    return tx.user.findUniqueOrThrow({ where: { id }, select: userDetailSelect });
  });
  return withAvatarUrl(user);
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
