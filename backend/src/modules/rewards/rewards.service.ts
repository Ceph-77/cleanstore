import { prisma } from "../../db/prisma";

/**
 * Métriques de reconnaissance (Q55-57) — dérivées des données existantes,
 * rien de nouveau à faire persister ici (recalculées à la demande).
 *
 * Approximations documentées (pas de champ "no-show" dédié dans le
 * modèle) :
 *  - fiabilité = tâches complétées/inspectées ÷ tâches assignées ayant
 *    conclu (complétée/inspectée/annulée) — une annulation alors qu'un
 *    travailleur était assigné compte comme un manquement.
 *  - ponctualité = moyenne de deux signaux par tâche conclue : démarrée
 *    dans la fenêtre horaire du modèle (si une fenêtre est définie) et
 *    terminée en ≤ durée estimée (si une estimation existe). Une tâche
 *    sans fenêtre/estimation compte "réussie" sur ce signal (rien à
 *    manquer) — n'écrase donc jamais la moyenne pour les modèles simples.
 */
export interface RewardMetrics {
  reliability: number | null; // 0..1
  punctuality: number | null; // 0..1
  quality: number | null; // 0..100 (moyenne des scores d'inspection)
  experience: { tasksCompleted: number; categoryVariety: number };
  seniorityDays: number;
  targetHitRate: number | null; // 0..1, tâches à cible atteinte
}

const RESOLVED_STATUSES = ["completed", "inspected", "cancelled"] as const;
const DONE_STATUSES = ["completed", "inspected"] as const;

export async function computeRewardMetrics(workerId: string): Promise<RewardMetrics> {
  const [user, resolvedTasks, inspections] = await Promise.all([
    prisma.user.findUnique({ where: { id: workerId }, select: { createdAt: true } }),
    prisma.task.findMany({
      where: { assignedToId: workerId, status: { in: [...RESOLVED_STATUSES] } },
      select: {
        status: true,
        category: true,
        startedAt: true,
        updatedAt: true,
        timeWindowStart: true,
        timeWindowEnd: true,
        estimatedDurationMinutes: true,
        metricTarget: true,
        reportedMetricValue: true,
      },
    }),
    prisma.taskInspection.findMany({
      where: { task: { assignedToId: workerId } },
      select: { score: true },
    }),
  ]);

  const doneTasks = resolvedTasks.filter((t) => DONE_STATUSES.includes(t.status as (typeof DONE_STATUSES)[number]));
  const reliability = resolvedTasks.length > 0 ? doneTasks.length / resolvedTasks.length : null;

  let punctualitySum = 0;
  let punctualityCount = 0;
  for (const t of doneTasks) {
    let signals = 0;
    let hits = 0;
    if (t.timeWindowStart && t.timeWindowEnd && t.startedAt) {
      signals += 1;
      const hhmm = t.startedAt.toISOString().slice(11, 16); // approximation UTC — suffisant pour un signal relatif
      if (hhmm >= t.timeWindowStart && hhmm <= t.timeWindowEnd) hits += 1;
    }
    if (t.estimatedDurationMinutes && t.startedAt) {
      signals += 1;
      const minutes = (t.updatedAt.getTime() - t.startedAt.getTime()) / 60000;
      if (minutes <= t.estimatedDurationMinutes) hits += 1;
    }
    if (signals > 0) {
      punctualitySum += hits / signals;
      punctualityCount += 1;
    }
  }
  const punctuality = punctualityCount > 0 ? punctualitySum / punctualityCount : null;

  const quality =
    inspections.length > 0 ? inspections.reduce((sum, i) => sum + i.score, 0) / inspections.length : null;

  const categoryVariety = new Set(doneTasks.map((t) => t.category).filter((c): c is string => !!c)).size;

  const withTarget = doneTasks.filter((t) => t.metricTarget != null && t.reportedMetricValue != null);
  const targetHitRate =
    withTarget.length > 0
      ? withTarget.filter((t) => Number(t.reportedMetricValue) >= Number(t.metricTarget)).length / withTarget.length
      : null;

  const seniorityDays = user
    ? Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    reliability,
    punctuality,
    quality,
    experience: { tasksCompleted: doneTasks.length, categoryVariety },
    seniorityDays,
    targetHitRate,
  };
}

export type BadgeKey =
  | "fiable"
  | "ponctuel"
  | "qualite"
  | "veteran"
  | "polyvalent"
  | "sur_la_cible"
  | "habitue";

const BADGE_LABELS: Record<BadgeKey, string> = {
  fiable: "Fiable",
  ponctuel: "Ponctuel",
  qualite: "Qualité",
  veteran: "Vétéran",
  polyvalent: "Polyvalent",
  sur_la_cible: "Sur la cible",
  habitue: "Habitué",
};

export function badgeLabel(key: BadgeKey): string {
  return BADGE_LABELS[key];
}

/** Seuils — faciles à ajuster, exigent un échantillon minimal pour éviter le bruit sur peu de tâches. */
export function computeBadges(m: RewardMetrics): BadgeKey[] {
  const badges: BadgeKey[] = [];
  if (m.reliability != null && m.experience.tasksCompleted >= 5 && m.reliability >= 0.9) badges.push("fiable");
  if (m.punctuality != null && m.experience.tasksCompleted >= 5 && m.punctuality >= 0.9) badges.push("ponctuel");
  if (m.quality != null && m.quality >= 90) badges.push("qualite");
  if (m.seniorityDays >= 180) badges.push("veteran");
  if (m.experience.categoryVariety >= 4) badges.push("polyvalent");
  if (m.targetHitRate != null && m.targetHitRate >= 0.9) badges.push("sur_la_cible");
  if (m.experience.tasksCompleted >= 50) badges.push("habitue");
  return badges;
}

/** Seuil d'accès prioritaire aux nouvelles tâches (Q55 : "fenêtre d'avance"). */
export const PRIORITY_BADGE_THRESHOLD = 3;
export const PRIORITY_WINDOW_MINUTES = 30;

export async function hasPriorityAccess(workerId: string): Promise<boolean> {
  const metrics = await computeRewardMetrics(workerId);
  return computeBadges(metrics).length >= PRIORITY_BADGE_THRESHOLD;
}
