import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
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

export async function listMarketplaceTasks(cursor?: string | null): Promise<Page<Task>> {
  const r = await apiClient.get<{ tasks: Task[]; nextCursor: string | null }>(
    `/marketplace/tasks${pageQuery(cursor)}`
  );
  return { items: r.tasks, nextCursor: r.nextCursor };
}

export function claimTask(taskId: string, note?: string, clanId?: string) {
  return apiClient.post<{ claim: TaskClaim }>(`/marketplace/tasks/${taskId}/claims`, { note, clanId });
}

export function listMyTaskClaims() {
  return apiClient.get<{ claims: TaskClaim[] }>("/marketplace/my-task-claims");
}

export interface AssignableWorker {
  id: string;
  fullName: string | null;
  email: string;
}

export function listAssignableWorkers() {
  return apiClient.get<{ workers: AssignableWorker[] }>("/marketplace/assignable-workers");
}

export function directAssignTask(taskId: string, workerId: string) {
  return apiClient.post<{ task: Task }>("/marketplace/direct-assign", { taskId, workerId });
}
