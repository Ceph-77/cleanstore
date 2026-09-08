import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { trackEventSchema } from "./analytics.schema";

type TrackEvent = z.infer<typeof trackEventSchema>;
export interface EventContext {
  userId?: string | null;
  role?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Writers
// ─────────────────────────────────────────────────────────────────────────────

export async function recordClientEvents(events: TrackEvent[], ctx: EventContext) {
  await prisma.analyticsEvent.createMany({
    data: events.map((e) => ({
      name: e.name,
      userId: ctx.userId ?? null,
      role: ctx.role ?? null,
      sessionId: e.sessionId ?? null,
      path: e.path ?? null,
      props: e.props ? (e.props as Prisma.InputJsonValue) : undefined,
      source: "client",
    })),
  });
}

/**
 * Fire-and-forget server milestone. Call as
 * `void recordServerEvent("task_completed", { userId }).catch(() => {})`
 * from a controller after a successful action — it must never break the flow.
 */
export async function recordServerEvent(
  name: string,
  ctx: EventContext & { props?: Record<string, string | number | boolean | null> }
) {
  await prisma.analyticsEvent.create({
    data: {
      name,
      userId: ctx.userId ?? null,
      role: ctx.role ?? null,
      props: ctx.props ? (ctx.props as Prisma.InputJsonValue) : undefined,
      source: "server",
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure funnel + CSV helpers (unit-tested)
// ─────────────────────────────────────────────────────────────────────────────

export interface FunnelRow {
  name: string;
  count: number;
  /** % of the first step's actors that also reached this step. */
  conversionFromFirstPct: number;
  /** % lost between the previous step and this one. */
  dropFromPrevPct: number;
}

/**
 * Ordered funnel. An actor "reached" step i only if it has an event for every
 * step 0..i (monotonic — matches classic funnel semantics without needing
 * per-event timestamps). `key` is the actor: a client sessionId or a userId.
 */
export function computeFunnel(
  events: { key: string | null; name: string }[],
  steps: string[]
): FunnelRow[] {
  const stepSet = new Set(steps);
  const byActor = new Map<string, Set<string>>();
  for (const e of events) {
    if (!e.key || !stepSet.has(e.name)) continue;
    let seen = byActor.get(e.key);
    if (!seen) {
      seen = new Set();
      byActor.set(e.key, seen);
    }
    seen.add(e.name);
  }

  const counts = steps.map((_, i) => {
    const need = steps.slice(0, i + 1);
    let n = 0;
    for (const seen of byActor.values()) {
      if (need.every((s) => seen.has(s))) n += 1;
    }
    return n;
  });

  const first = counts[0] ?? 0;
  return steps.map((name, i) => ({
    name,
    count: counts[i]!,
    conversionFromFirstPct: first ? Math.round((counts[i]! / first) * 100) : 0,
    dropFromPrevPct:
      i === 0 || !counts[i - 1] ? 0 : Math.round((1 - counts[i]! / counts[i - 1]!) * 100),
  }));
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const cell = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => cell(r[h])).join(",")),
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Predefined funnels
// ─────────────────────────────────────────────────────────────────────────────

/** Worker path, before any request succeeds — keyed by client sessionId. */
export const WORKER_INTENT_FUNNEL = [
  "task_marketplace_viewed",
  "task_claim_opened",
  "task_claim_submitted",
];

/** Worker path, server milestones — keyed by userId. */
export const WORKER_DELIVERY_FUNNEL = [
  "task_claim_submitted",
  "task_claim_approved",
  "task_started",
  "task_completed",
  "earning_paid",
];

// ─────────────────────────────────────────────────────────────────────────────
// Readers
// ─────────────────────────────────────────────────────────────────────────────

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getOverview(days: number) {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["name", "source"],
    where: { createdAt: { gte: since(days) } },
    _count: { _all: true },
    orderBy: { _count: { name: "desc" } },
  });
  return grouped.map((g) => ({ name: g.name, source: g.source, count: g._count._all }));
}

export async function getFunnel(steps: string[], keyField: "sessionId" | "userId", days: number) {
  const rows = await prisma.analyticsEvent.findMany({
    where: { name: { in: steps }, createdAt: { gte: since(days) } },
    select: { name: true, sessionId: true, userId: true },
  });
  return computeFunnel(
    rows.map((r) => ({ name: r.name, key: keyField === "sessionId" ? r.sessionId : r.userId })),
    steps
  );
}

export async function listRecentEvents(days: number, limit = 200) {
  return prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since(days) } },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 1000),
    select: {
      id: true,
      name: true,
      source: true,
      role: true,
      userId: true,
      sessionId: true,
      path: true,
      props: true,
      createdAt: true,
    },
  });
}

export async function exportCsv(days: number) {
  const rows = await listRecentEvents(days, 5000);
  return toCsv(
    rows.map((r) => ({
      createdAt: r.createdAt.toISOString(),
      name: r.name,
      source: r.source,
      role: r.role ?? "",
      userId: r.userId ?? "",
      sessionId: r.sessionId ?? "",
      path: r.path ?? "",
      props: r.props ?? "",
    }))
  );
}
