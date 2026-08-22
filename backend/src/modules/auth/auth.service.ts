import { randomBytes, createHash } from "crypto";
import { prisma } from "../../db/prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
import { sendPasswordResetEmail, isEmailConfigured } from "../../utils/email";
import { env } from "../../config/env";
import type { registerWorkerSchema } from "./auth.schema";
import type { z } from "zod";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const CURRENT_TERMS_VERSION = "1.0-2026-08-21";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

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
    termsAcceptedAt: user.termsAcceptedAt,
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
      termsAcceptedAt: new Date(),
      termsVersion: CURRENT_TERMS_VERSION,
      roles: { create: { roleId: role.id } },
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleKey: "travailleur" as const,
    termsAcceptedAt: user.termsAcceptedAt,
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
    phone: user.phone,
    address: user.address,
    roleKey: user.roles[0]?.role.key ?? null,
    termsAcceptedAt: user.termsAcceptedAt,
  };
}

export async function acceptTerms(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { termsAcceptedAt: new Date(), termsVersion: CURRENT_TERMS_VERSION },
  });
  return getUserById(userId);
}

export async function updateProfile(
  userId: string,
  data: { fullName?: string; phone?: string; address?: string }
) {
  await prisma.user.update({ where: { id: userId }, data });
  return getUserById(userId);
}

export async function requestPasswordReset(email: string) {
  if (!isEmailConfigured()) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!resetToken) {
    throw new Error("This reset link is invalid or has expired");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new Error("Current password is incorrect");
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
