import { prisma } from "../../db/prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
import type { registerWorkerSchema } from "./auth.schema";
import type { z } from "zod";

type RegisterWorkerInput = z.infer<typeof registerWorkerSchema>;

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const primaryRole = user.roles[0]?.role.key ?? null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleKey: primaryRole,
  };
}

export async function registerWorker(data: RegisterWorkerInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { key: "travailleur" } });
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      roles: { create: { roleId: role.id } },
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleKey: "travailleur" as const,
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleKey: user.roles[0]?.role.key ?? null,
  };
}
