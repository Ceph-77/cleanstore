/**
 * Point values for the worker engagement system. Positive-only — a bad
 * inspection score simply yields no bonus, never a deduction. Tweak freely.
 */
export const POINTS = {
  TASK_COMPLETED: 20,
  ZONE_ARRIVAL: 5,
  ON_TIME: 10,
  /** Bonus for beating the estimate: +10 base, +1 per 5 min saved, capped at +30. */
  fasterBonus(minutesSaved: number): number {
    return Math.min(30, 10 + Math.floor(Math.max(0, minutesSaved) / 5));
  },
  QUALITY_BONUS: 15,
  QUALITY_MIN_SCORE: 90,
  /** Streak milestone days that trigger a moment; bonus = day count (capped 30). */
  STREAK_MILESTONES: [3, 5, 7, 14, 30, 60, 100] as const,
  streakBonus(days: number): number {
    return Math.min(30, days);
  },
  /** Completed-task-count milestones → moment + bonus. */
  TASK_MILESTONES: { 1: 25, 10: 50, 50: 150, 100: 300, 250: 500 } as Record<number, number>,
} as const;

export type PointKind =
  | "task_completed"
  | "zone_arrival"
  | "on_time"
  | "faster"
  | "quality"
  | "streak_bonus"
  | "milestone"
  | "personal_best";

export type MomentType =
  | "zone_arrival"
  | "faster_than_estimated"
  | "streak"
  | "milestone"
  | "personal_best"
  | "monthly_recap";
