import { apiClient } from "./client";
import type { ClaimStatus, StoreClaim, TaskClaim } from "../types";

export function listStoreClaims(status?: ClaimStatus) {
  const query = status ? `?status=${status}` : "";
  return apiClient.get<{ claims: StoreClaim[] }>(`/store-claims${query}`);
}

export function decideStoreClaim(id: string, status: "approved" | "rejected") {
  return apiClient.patch<{ claim: StoreClaim }>(`/store-claims/${id}`, { status });
}

export function listTaskClaims(status?: ClaimStatus) {
  const query = status ? `?status=${status}` : "";
  return apiClient.get<{ claims: TaskClaim[] }>(`/task-claims${query}`);
}

export function decideTaskClaim(id: string, status: "approved" | "rejected") {
  return apiClient.patch<{ claim: TaskClaim }>(`/task-claims/${id}`, { status });
}
