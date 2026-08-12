import { prisma } from "../../db/prisma";
import { verifyPassword } from "../../utils/password";

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
