import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { ClaimStatus, StoreClaim, TaskClaim } from "../types";

export async function listStoreClaims(
  status?: ClaimStatus,
  cursor?: string | null
): Promise<Page<StoreClaim>> {
  const r = await apiClient.get<{ claims: StoreClaim[]; nextCursor: string | null }>(
    `/store-claims${pageQuery(cursor, { status })}`
  );
  return { items: r.claims, nextCursor: r.nextCursor };
}

export function decideStoreClaim(id: string, status: "approved" | "rejected", reason?: string) {
  return apiClient.patch<{ claim: StoreClaim }>(`/store-claims/${id}`, { status, reason });
}

export async function listTaskClaims(
  status?: ClaimStatus,
  cursor?: string | null
): Promise<Page<TaskClaim>> {
  const r = await apiClient.get<{ claims: TaskClaim[]; nextCursor: string | null }>(
    `/task-claims${pageQuery(cursor, { status })}`
  );
  return { items: r.claims, nextCursor: r.nextCursor };
}

export function decideTaskClaim(id: string, status: "approved" | "rejected", reason?: string) {
  return apiClient.patch<{ claim: TaskClaim }>(`/task-claims/${id}`, { status, reason });
}
