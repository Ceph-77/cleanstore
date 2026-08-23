import { apiClient } from "./client";
import type { StoreClaim, TaskClaim, Task } from "../types";

export interface MarketplaceStore {
  id: string;
  name: string;
  banner: string | null;
  city: string | null;
  address: string | null;
  cleaningFrequency: string | null;
  grandeCompagnie: { id: string; name: string } | null;
}

export function listAvailableStores() {
  return apiClient.get<{ stores: MarketplaceStore[] }>("/marketplace/stores");
}

export function claimStore(storeId: string, note?: string) {
  return apiClient.post<{ claim: StoreClaim }>(`/marketplace/stores/${storeId}/claims`, { note });
}

export function listMyStoreClaims() {
  return apiClient.get<{ claims: StoreClaim[] }>("/marketplace/my-store-claims");
}

export function listMarketplaceTasks() {
  return apiClient.get<{ tasks: Task[] }>("/marketplace/tasks");
}

export function claimTask(taskId: string, note?: string) {
  return apiClient.post<{ claim: TaskClaim }>(`/marketplace/tasks/${taskId}/claims`, { note });
}

export function listMyTaskClaims() {
  return apiClient.get<{ claims: TaskClaim[] }>("/marketplace/my-task-claims");
}
