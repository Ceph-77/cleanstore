import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { startOfCurrentMonth, localDayKey } from "../../utils/week";
import { sendMomentEmail } from "../../utils/email";
import { POINTS, type PointKind, type MomentType } from "./points";

const DAY_MS = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Low-level writers
// ─────────────────────────────────────────────────────────────────────────────

async function award(workerId: string, kind: PointKind, points: number, taskId?: string) {
  if (points <= 0) return;
  await prisma.pointEntry.create({ data: { workerId, kind, points, taskId: taskId ?? null } });
}

interface MomentInput {
  workerId: string;
  taskId?: string | null;
  type: MomentType;
  title: string;
  body: string;
  pointsAwarded?: number;
  meta?: Record<string, unknown>;
  email?: boolean;
}

async function createMoment(m: MomentInput) {
  const moment = await prisma.workerMoment.create({
    data: {
      workerId: m.workerId,
      taskId: m.taskId ?? null,
      type: m.type,
      title: m.title,
      body: m.body,
      pointsAwarded: m.pointsAwarded ?? 0,
      meta: m.meta ? (m.meta as Prisma.InputJsonValue) : undefined,
    },
  });

  if (m.email) {
    void (async () => {
      const worker = await prisma.user.findUnique({
        where: { id: m.workerId },
        select: { email: true, fullName: true },
      });
      if (!worker?.email) return;
      await sendMomentEmail(worker.email, { title: m.title, body: m.body, name: worker.fullName });
      await prisma.workerMoment.update({ where: { id: moment.id }, data: { emailedAt: new Date() } });
    })().catch(() => {});
  }

  return moment;
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak
// ─────────────────────────────────────────────────────────────────────────────

function streakFromDayKeys(dayKeys: Set<string>, now = new Date()): number {
  const today = localDayKey(now);
  const yesterday = localDayKey(new Date(now.getTime() - DAY_MS));
  const anchor = dayKeys.has(today) ? today : dayKeys.has(yesterday) ? yesterday : null;
  if (!anchor) return 0;

  let streak = 0;
  let cursor = new Date(`${anchor}T12:00:00Z`);
  while (dayKeys.has(localDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

export async function computeStreak(workerId: string): Promise<number> {
  const entries = await prisma.pointEntry.findMany({
    where: { workerId, kind: "task_completed" },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return streakFromDayKeys(new Set(entries.map((e) => localDayKey(e.createdAt))));
}

// ─────────────────────────────────────────────────────────────────────────────
// Event hooks — called fire-and-forget by the task services
// ─────────────────────────────────────────────────────────────────────────────

export async function onTaskStarted(task: { id: string; assignedToId: string | null }) {
  const workerId = task.assignedToId;
  if (!workerId) return;

  const already = await prisma.workerMoment.findFirst({
    where: { workerId, taskId: task.id, type: "zone_arrival" },
    select: { id: true },
  });
  if (already) return;

  await award(workerId, "zone_arrival", POINTS.ZONE_ARRIVAL, task.id);
  await createMoment({
    workerId,
    taskId: task.id,
    type: "zone_arrival",
    title: "✅ Bien arrivé sur place",
    body: "Tu es au bon endroit. Bon travail !",
    pointsAwarded: POINTS.ZONE_ARRIVAL,
  });
}

export async function onTaskCompleted(task: {
  id: string;
  assignedToId: string | null;
  startedAt: Date | null;
  estimatedDurationMinutes: number | null;
}) {
  const workerId = task.assignedToId;
  if (!workerId) return;

  await award(workerId, "task_completed", POINTS.TASK_COMPLETED, task.id);

  // ── Beat the clock ──
  if (task.startedAt && task.estimatedDurationMinutes && task.estimatedDurationMinutes > 0) {
    const elapsedMin = (Date.now() - task.startedAt.getTime()) / 60000;
    const estimateMin = task.estimatedDurationMinutes;
    if (elapsedMin <= estimateMin) {
      await award(workerId, "on_time", POINTS.ON_TIME, task.id);
    }
    if (elapsedMin < estimateMin) {
      const minutesSaved = Math.round(estimateMin - elapsedMin);
      const bonus = POINTS.fasterBonus(minutesSaved);
      await award(workerId, "faster", bonus, task.id);
      const ratio = elapsedMin / estimateMin;
      await createMoment({
        workerId,
        taskId: task.id,
        type: "faster_than_estimated",
        title: "⚡ Plus vite que prévu",
        body: `Tâche terminée ${minutesSaved} min avant l'estimation.`,
        pointsAwarded: bonus,
        meta: { minutesSaved, elapsedMin: Math.round(elapsedMin), estimateMin, ratio },
        email: minutesSaved >= 20,
      });

      // ── Personal best speed (needs some history to be meaningful) ──
      const priorFast = await prisma.workerMoment.findMany({
        where: { workerId, type: "faster_than_estimated", taskId: { not: task.id } },
        select: { meta: true },
      });
      if (priorFast.length >= 3) {
        const priorBest = Math.min(
          ...priorFast.map((m) => {
            const r = (m.meta as { ratio?: number } | null)?.ratio;
            return typeof r === "number" ? r : Number.POSITIVE_INFINITY;
          })
        );
        if (ratio < priorBest) {
          await createMoment({
            workerId,
            taskId: task.id,
            type: "personal_best",
            title: "🚀 Nouveau record de rapidité",
            body: "C'est ta tâche la plus rapide face à l'estimation. Bravo !",
          });
        }
      }
    }
  }

  // ── Task-count milestones ──
  const completedCount = await prisma.pointEntry.count({
    where: { workerId, kind: "task_completed" },
  });
  const milestoneBonus = POINTS.TASK_MILESTONES[completedCount];
  if (milestoneBonus) {
    await award(workerId, "milestone", milestoneBonus, task.id);
    await createMoment({
      workerId,
      taskId: task.id,
      type: "milestone",
      title: `🏆 ${completedCount}e tâche complétée`,
      body:
        completedCount === 1
          ? "Ta toute première tâche sur KLEAN'STOR. Beaucoup d'autres à venir !"
          : `${completedCount} tâches menées à bien. Solide.`,
      pointsAwarded: milestoneBonus,
      meta: { milestone: completedCount },
      email: completedCount >= 10,
    });
  }

  // ── Streak milestones ──
  const streakDays = await computeStreak(workerId);
  if ((POINTS.STREAK_MILESTONES as readonly number[]).includes(streakDays)) {
    const since = new Date(Date.now() - 20 * 60 * 60 * 1000);
    const dupe = await prisma.workerMoment.findFirst({
      where: {
        workerId,
        type: "streak",
        createdAt: { gte: since },
        meta: { path: ["days"], equals: streakDays },
      },
      select: { id: true },
    });
    if (!dupe) {
      const bonus = POINTS.streakBonus(streakDays);
      await award(workerId, "streak_bonus", bonus, task.id);
      await createMoment({
        workerId,
        taskId: task.id,
        type: "streak",
        title: `🔥 ${streakDays} jours de suite`,
        body: `${streakDays} journées d'affilée avec au moins une tâche complétée. Ne casse pas la série !`,
        pointsAwarded: bonus,
        meta: { days: streakDays },
        email: streakDays >= 5,
      });
    }
  }
}

export async function onTaskInspected(taskId: string, score: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assignedToId: true },
  });
  const workerId = task?.assignedToId;
  if (!workerId) return;

  if (score >= POINTS.QUALITY_MIN_SCORE) {
    await award(workerId, "quality", POINTS.QUALITY_BONUS, taskId);
  }

  const prior = await prisma.taskInspection.findMany({
    where: { task: { assignedToId: workerId }, taskId: { not: taskId } },
    select: { score: true },
  });
  if (prior.length >= 1 && score > Math.max(...prior.map((p) => p.score))) {
    await createMoment({
      workerId,
      taskId,
      type: "personal_best",
      title: "🌟 Meilleure inspection à vie",
      body: `Score de ${score}/100 — ton meilleur à ce jour.`,
      pointsAwarded: score >= POINTS.QUALITY_MIN_SCORE ? POINTS.QUALITY_BONUS : 0,
      meta: { score },
      email: true,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

export async function getMySummary(workerId: string) {
  const [totalAgg, monthAgg, completedCount, streakDays] = await Promise.all([
    prisma.pointEntry.aggregate({ _sum: { points: true }, where: { workerId } }),
    prisma.pointEntry.aggregate({
      _sum: { points: true },
      where: { workerId, createdAt: { gte: startOfCurrentMonth() } },
    }),
    prisma.pointEntry.count({ where: { workerId, kind: "task_completed" } }),
    computeStreak(workerId),
  ]);
  return {
    pointsTotal: totalAgg._sum.points ?? 0,
    pointsThisMonth: monthAgg._sum.points ?? 0,
    tasksCompleted: completedCount,
    streakDays,
  };
}

export function listUnseenMoments(workerId: string) {
  return prisma.workerMoment.findMany({
    where: { workerId, seenAt: null },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
}

export async function markMomentSeen(workerId: string, momentId: string) {
  await prisma.workerMoment.updateMany({
    where: { id: momentId, workerId },
    data: { seenAt: new Date() },
  });
}

export async function markAllMomentsSeen(workerId: string) {
  await prisma.workerMoment.updateMany({
    where: { workerId, seenAt: null },
    data: { seenAt: new Date() },
  });
}

export interface LeaderboardRow {
  workerId: string;
  fullName: string | null;
  pointsThisMonth: number;
  pointsTotal: number;
  onTimeRate: number | null;
  avgQuality: number | null;
  tasksThisMonth: number;
  rank: number;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const monthStart = startOfCurrentMonth();

  const workers = await prisma.user.findMany({
    where: { isActive: true, roles: { some: { role: { key: "travailleur" } } } },
    select: { id: true, fullName: true },
  });
  const ids = workers.map((w) => w.id);
  if (ids.length === 0) return [];

  const [monthGroups, totalGroups, monthEntries, inspections] = await Promise.all([
    prisma.pointEntry.groupBy({
      by: ["workerId"],
      where: { workerId: { in: ids }, createdAt: { gte: monthStart } },
      _sum: { points: true },
    }),
    prisma.pointEntry.groupBy({
      by: ["workerId"],
      where: { workerId: { in: ids } },
      _sum: { points: true },
    }),
    prisma.pointEntry.findMany({
      where: {
        workerId: { in: ids },
        createdAt: { gte: monthStart },
        kind: { in: ["task_completed", "on_time"] },
      },
      select: { workerId: true, kind: true },
    }),
    prisma.taskInspection.findMany({
      where: { task: { assignedToId: { in: ids } } },
      select: { score: true, task: { select: { assignedToId: true } } },
    }),
  ]);

  const monthMap = new Map(monthGroups.map((g) => [g.workerId, g._sum.points ?? 0]));
  const totalMap = new Map(totalGroups.map((g) => [g.workerId, g._sum.points ?? 0]));

  const completedByWorker = new Map<string, number>();
  const onTimeByWorker = new Map<string, number>();
  for (const e of monthEntries) {
    const target = e.kind === "task_completed" ? completedByWorker : onTimeByWorker;
    target.set(e.workerId, (target.get(e.workerId) ?? 0) + 1);
  }

  const qualityByWorker = new Map<string, number[]>();
  for (const i of inspections) {
    const wid = i.task.assignedToId;
    if (!wid) continue;
    const arr = qualityByWorker.get(wid) ?? [];
    arr.push(i.score);
    qualityByWorker.set(wid, arr);
  }

  const rows = workers.map((w) => {
    const completed = completedByWorker.get(w.id) ?? 0;
    const onTime = onTimeByWorker.get(w.id) ?? 0;
    const scores = qualityByWorker.get(w.id) ?? [];
    return {
      workerId: w.id,
      fullName: w.fullName,
      pointsThisMonth: monthMap.get(w.id) ?? 0,
      pointsTotal: totalMap.get(w.id) ?? 0,
      onTimeRate: completed > 0 ? onTime / completed : null,
      avgQuality: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      tasksThisMonth: completed,
      rank: 0,
    };
  });

  rows.sort(
    (a, b) => b.pointsThisMonth - a.pointsThisMonth || b.pointsTotal - a.pointsTotal
  );
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly recap (triggered by the system cron route)
// ─────────────────────────────────────────────────────────────────────────────

export async function runMonthlyRecap(): Promise<{ sent: number }> {
  const thisMonthStart = startOfCurrentMonth();
  const lastMonthStart = startOfCurrentMonth(new Date(thisMonthStart.getTime() - DAY_MS));
  const periodKey = localDayKey(lastMonthStart).slice(0, 7); // YYYY-MM

  const groups = await prisma.pointEntry.groupBy({
    by: ["workerId"],
    where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
    _sum: { points: true },
  });
  if (groups.length === 0) return { sent: 0 };

  const ranked = [...groups].sort((a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0));

  let sent = 0;
  for (let i = 0; i < ranked.length; i += 1) {
    const workerId = ranked[i].workerId;
    const points = ranked[i]._sum.points ?? 0;

    const existing = await prisma.workerMoment.findFirst({
      where: { workerId, type: "monthly_recap", meta: { path: ["period"], equals: periodKey } },
      select: { id: true },
    });
    if (existing) continue;

    const completed = await prisma.pointEntry.count({
      where: {
        workerId,
        kind: "task_completed",
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    });

    await createMoment({
      workerId,
      type: "monthly_recap",
      title: `📅 Ton mois : ${points} points`,
      body: `${completed} tâche${completed > 1 ? "s" : ""} complétée${completed > 1 ? "s" : ""} · classé ${i + 1}${
        i === 0 ? "er" : "e"
      } sur ${ranked.length}. Un nouveau mois commence !`,
      meta: { period: periodKey, points, completed, rank: i + 1, of: ranked.length },
      email: true,
    });
    sent += 1;
  }

  return { sent };
}
