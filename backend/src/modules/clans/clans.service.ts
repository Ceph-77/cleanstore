import { randomBytes } from "crypto";
import { prisma } from "../../db/prisma";

const clanInclude = {
  members: {
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  },
} as const;

function newInviteCode(): string {
  // 6 caractères sans ambiguïté (pas de 0/O/1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(6))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

export async function createClan(userId: string, name: string) {
  let inviteCode = newInviteCode();
  for (let i = 0; i < 5 && (await prisma.clan.findUnique({ where: { inviteCode } })); i++) {
    inviteCode = newInviteCode();
  }
  return prisma.clan.create({
    data: {
      name: name.trim(),
      founderId: userId,
      inviteCode,
      members: { create: { userId } },
    },
    include: clanInclude,
  });
}

export function myClans(userId: string) {
  return prisma.clan.findMany({
    where: { members: { some: { userId } } },
    include: clanInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function joinByCode(userId: string, code: string) {
  const clan = await prisma.clan.findUnique({ where: { inviteCode: code.trim().toUpperCase() } });
  if (!clan) throw new Error("Code d'invitation invalide.");
  await prisma.clanMember.upsert({
    where: { clanId_userId: { clanId: clan.id, userId } },
    update: {},
    create: { clanId: clan.id, userId },
  });
  return prisma.clan.findUniqueOrThrow({ where: { id: clan.id }, include: clanInclude });
}

export async function inviteByEmail(clanId: string, founderId: string, email: string) {
  const clan = await prisma.clan.findUniqueOrThrow({ where: { id: clanId } });
  if (clan.founderId !== founderId) throw new Error("Seul le fondateur peut inviter.");
  return prisma.clanInvite.create({
    data: { clanId, email: email.trim().toLowerCase() },
  });
}

export async function pendingInvitesForEmail(email: string) {
  return prisma.clanInvite.findMany({
    where: { email: email.trim().toLowerCase(), acceptedAt: null },
    include: { clan: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvite(userId: string, userEmail: string, inviteId: string) {
  const invite = await prisma.clanInvite.findUniqueOrThrow({ where: { id: inviteId } });
  if (invite.acceptedAt) throw new Error("Invitation déjà acceptée.");
  if (invite.email !== userEmail.trim().toLowerCase()) {
    throw new Error("Cette invitation ne vous est pas destinée.");
  }
  await prisma.$transaction([
    prisma.clanMember.upsert({
      where: { clanId_userId: { clanId: invite.clanId, userId } },
      update: {},
      create: { clanId: invite.clanId, userId },
    }),
    prisma.clanInvite.update({ where: { id: inviteId }, data: { acceptedAt: new Date() } }),
  ]);
  return prisma.clan.findUniqueOrThrow({ where: { id: invite.clanId }, include: clanInclude });
}

/**
 * Quitter un clan. On garde tout l'acquis (aucune donnée de tâche/gain touchée).
 * Si le fondateur part, le doyen des membres restants devient fondateur ; s'il
 * ne reste personne, le clan est supprimé.
 */
export async function leaveClan(userId: string, clanId: string) {
  const clan = await prisma.clan.findUniqueOrThrow({
    where: { id: clanId },
    include: { members: { orderBy: { joinedAt: "asc" } } },
  });
  const isMember = clan.members.some((m) => m.userId === userId);
  if (!isMember) throw new Error("Vous n'êtes pas membre de ce clan.");

  await prisma.$transaction(async (tx) => {
    await tx.clanMember.delete({ where: { clanId_userId: { clanId, userId } } });
    const remaining = clan.members.filter((m) => m.userId !== userId);
    if (remaining.length === 0) {
      await tx.clan.delete({ where: { id: clanId } });
    } else if (clan.founderId === userId) {
      await tx.clan.update({ where: { id: clanId }, data: { founderId: remaining[0].userId } });
    }
  });
}

export async function removeMember(founderId: string, clanId: string, memberUserId: string) {
  const clan = await prisma.clan.findUniqueOrThrow({ where: { id: clanId } });
  if (clan.founderId !== founderId) throw new Error("Seul le fondateur peut retirer un membre.");
  if (memberUserId === founderId) throw new Error("Le fondateur ne peut pas se retirer ici (quitter le clan à la place).");
  await prisma.clanMember.delete({ where: { clanId_userId: { clanId, userId: memberUserId } } });
  return prisma.clan.findUniqueOrThrow({ where: { id: clanId }, include: clanInclude });
}
