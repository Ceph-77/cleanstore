import { prisma } from "../../db/prisma";
import { can } from "../auth/permissions";
import { pageArgs, toPage, type PageParams } from "../../utils/pagination";
import type { MessageThread, RoleKey } from "@prisma/client";

/** Un message reste modifiable un court moment après l'envoi (Q65), jamais après. */
export const MESSAGE_EDIT_WINDOW_MINUTES = 15;

/** Ids fixes des 2 fils globaux — garantit un seul exemplaire de chacun sans
 * contrainte DB (upsert par clé primaire). */
const GLOBAL_THREAD_IDS = {
  jazzette: "global-jazzette",
  annonces: "global-annonces",
} as const;

const lastMessageInclude = {
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { body: true, createdAt: true, authorId: true },
  },
  _count: { select: { messages: true } },
};

function isAdmin(roleKeys: readonly RoleKey[]): boolean {
  return roleKeys.includes("admin");
}

/** Le fil global demandé, créé au besoin (id fixe, pas de doublon possible). */
export function ensureGlobalThread(kind: "jazzette" | "annonces") {
  const id = GLOBAL_THREAD_IDS[kind];
  const threadKind = kind === "jazzette" ? "global_jazzette" : "global_annonces";
  return prisma.messageThread.upsert({
    where: { id },
    update: {},
    create: { id, kind: threadKind },
  });
}

export async function getOrCreateTaskThread(taskId: string, userId: string, roleKeys: readonly RoleKey[]) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assignedToId: true } });
  if (!task) throw new Error("Tâche introuvable.");
  const allowed = task.assignedToId === userId || isAdmin(roleKeys) || can(roleKeys, "markettask", "manage");
  if (!allowed) throw new Error("Vous n'avez pas accès à la discussion de cette tâche.");

  return prisma.messageThread.upsert({
    where: { taskId },
    update: {},
    create: { kind: "task", taskId, createdById: userId },
  });
}

export async function getOrCreateClanThread(clanId: string, userId: string, roleKeys: readonly RoleKey[]) {
  const member = await prisma.clanMember.findUnique({ where: { clanId_userId: { clanId, userId } } });
  if (!member && !isAdmin(roleKeys)) {
    throw new Error("Vous n'êtes pas membre de ce clan.");
  }
  return prisma.messageThread.upsert({
    where: { clanId },
    update: {},
    create: { kind: "clan", clanId, createdById: userId },
  });
}

export async function createAdhocThread(creatorId: string, participantIds: string[], title?: string) {
  const ids = [...new Set([creatorId, ...participantIds])];
  const existing = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const validIds = existing.map((u) => u.id);
  if (validIds.length < 2) {
    throw new Error("Choisis au moins une autre personne pour démarrer une discussion.");
  }
  return prisma.messageThread.create({
    data: {
      kind: "adhoc",
      title,
      createdById: creatorId,
      participants: { createMany: { data: validIds.map((userId) => ({ userId })) } },
    },
  });
}

/**
 * Fils de l'utilisateur : ses tâches assignées, ses clans, ses fils libres, +
 * toujours les 2 fils globaux (créés au besoin). L'admin voit ces mêmes fils
 * "à lui" ici — parcourir TOUT passe par `listAllThreads` (modération).
 */
export async function listMyThreads(userId: string) {
  const [jazzette, annonces, taskThreads, clanThreads, adhocThreads] = await Promise.all([
    prisma.messageThread.upsert({
      where: { id: GLOBAL_THREAD_IDS.jazzette },
      update: {},
      create: { id: GLOBAL_THREAD_IDS.jazzette, kind: "global_jazzette" },
      include: lastMessageInclude,
    }),
    prisma.messageThread.upsert({
      where: { id: GLOBAL_THREAD_IDS.annonces },
      update: {},
      create: { id: GLOBAL_THREAD_IDS.annonces, kind: "global_annonces" },
      include: lastMessageInclude,
    }),
    prisma.messageThread.findMany({
      where: { kind: "task", task: { assignedToId: userId } },
      include: { task: { select: { id: true, description: true, storeId: true } }, ...lastMessageInclude },
    }),
    prisma.messageThread.findMany({
      where: { kind: "clan", clan: { members: { some: { userId } } } },
      include: { clan: { select: { id: true, name: true } }, ...lastMessageInclude },
    }),
    prisma.messageThread.findMany({
      where: { kind: "adhoc", participants: { some: { userId } } },
      include: { ...lastMessageInclude },
    }),
  ]);
  const all = [jazzette, annonces, ...taskThreads, ...clanThreads, ...adhocThreads];
  return all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/** Modération : liste tous les fils ayant au moins un message, tous types. */
export async function listAllThreads(page: PageParams) {
  const rows = await prisma.messageThread.findMany({
    where: { messages: { some: {} } },
    include: {
      task: { select: { id: true, description: true } },
      clan: { select: { id: true, name: true } },
      ...lastMessageInclude,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
  });
  return toPage(rows, page.limit);
}

async function canAccessThread(
  thread: MessageThread,
  userId: string,
  roleKeys: readonly RoleKey[],
): Promise<boolean> {
  if (isAdmin(roleKeys)) return true;
  switch (thread.kind) {
    case "task": {
      if (!thread.taskId) return false;
      if (can(roleKeys, "markettask", "manage")) return true;
      const task = await prisma.task.findUnique({ where: { id: thread.taskId }, select: { assignedToId: true } });
      return task?.assignedToId === userId;
    }
    case "clan": {
      if (!thread.clanId) return false;
      const member = await prisma.clanMember.findUnique({
        where: { clanId_userId: { clanId: thread.clanId, userId } },
      });
      return !!member;
    }
    case "global_jazzette":
    case "global_annonces":
      return true; // tout le monde lit — l'écriture est filtrée séparément
    case "adhoc": {
      const participant = await prisma.messageThreadParticipant.findUnique({
        where: { threadId_userId: { threadId: thread.id, userId } },
      });
      return !!participant;
    }
    default:
      return false;
  }
}

function canPostToThread(thread: MessageThread, roleKeys: readonly RoleKey[]): boolean {
  if (thread.kind === "global_annonces") return isAdmin(roleKeys);
  return true;
}

export async function listMessages(threadId: string, userId: string, roleKeys: readonly RoleKey[], page: PageParams) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new Error("Discussion introuvable.");
  if (!(await canAccessThread(thread, userId, roleKeys))) {
    throw new Error("Vous n'avez pas accès à cette discussion.");
  }
  const rows = await prisma.message.findMany({
    where: { threadId },
    include: { author: { select: { id: true, fullName: true, email: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(page),
  });
  return { thread, ...toPage(rows, page.limit) };
}

export async function postMessage(
  threadId: string,
  userId: string,
  roleKeys: readonly RoleKey[],
  body: string,
) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new Error("Discussion introuvable.");
  if (!(await canAccessThread(thread, userId, roleKeys))) {
    throw new Error("Vous n'avez pas accès à cette discussion.");
  }
  if (!canPostToThread(thread, roleKeys)) {
    throw new Error("Seul un administrateur peut publier dans les annonces.");
  }
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { threadId, authorId: userId, body },
      include: { author: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
  ]);
  return message;
}

export async function editMessage(messageId: string, userId: string, body: string) {
  const message = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });
  if (message.authorId !== userId) {
    throw new Error("Ce n'est pas votre message.");
  }
  const ageMinutes = (Date.now() - message.createdAt.getTime()) / 60000;
  if (ageMinutes > MESSAGE_EDIT_WINDOW_MINUTES) {
    throw new Error(`Le délai de modification (${MESSAGE_EDIT_WINDOW_MINUTES} min) est dépassé.`);
  }
  return prisma.message.update({
    where: { id: messageId },
    data: { body, editedAt: new Date() },
    include: { author: { select: { id: true, fullName: true, email: true } } },
  });
}
