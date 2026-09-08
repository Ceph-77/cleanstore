import { apiClient } from "./client";

export interface EventCount {
  name: string;
  source: string;
  count: number;
}

export interface FunnelRow {
  name: string;
  count: number;
  conversionFromFirstPct: number;
  dropFromPrevPct: number;
}

export interface AnalyticsOverview {
  days: number;
  counts: EventCount[];
  intentFunnel: FunnelRow[];
  deliveryFunnel: FunnelRow[];
}

export interface AnalyticsEventRow {
  id: string;
  name: string;
  source: string;
  role: string | null;
  userId: string | null;
  sessionId: string | null;
  path: string | null;
  props: unknown;
  createdAt: string;
}

export function getOverview(days: number) {
  return apiClient.get<AnalyticsOverview>(`/analytics/overview?days=${days}`);
}

export function getRecent(days: number) {
  return apiClient.get<{ events: AnalyticsEventRow[] }>(`/analytics/recent?days=${days}`);
}

/** Fetches the CSV with the session cookie and hands it to the browser to save. */
export async function downloadCsv(days: number) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/export.csv?days=${days}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Export impossible.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${days}j.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
