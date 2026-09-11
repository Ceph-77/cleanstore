import { apiClient } from "./client";
import type { ClanShareClaim, Task } from "../types";

export type ClaimableTask = Pick<Task, "id" | "description" | "price" | "status" | "assignedToId" | "reservedByClanId"> & {
  assignedTo: { id: string; fullName: string | null; email: string } | null;
  store: { id: string; name: string } | null;
};

export const createShareClaim = (taskId: string, percent: number, note?: string, completedStepIds?: string[]) =>
  apiClient.post<{ claim: ClanShareClaim }>(`/clan-shares/tasks/${taskId}`, { percent, note, completedStepIds });

export const listForTask = (taskId: string) =>
  apiClient.get<{ claims: ClanShareClaim[] }>(`/clan-shares/tasks/${taskId}`);

export const listMine = () => apiClient.get<{ claims: ClanShareClaim[] }>("/clan-shares/mine");

export const listClaimable = () => apiClient.get<{ tasks: ClaimableTask[] }>("/clan-shares/claimable");

export const listAll = () => apiClient.get<{ claims: ClanShareClaim[] }>("/clan-shares");

export const decideShareClaim = (id: string, decision: "accepted" | "refused", decisionNote?: string) =>
  apiClient.patch<{ claim: ClanShareClaim }>(`/clan-shares/${id}/decide`, { decision, decisionNote });

export const inspectorAwardShare = (id: string, percent: number, decisionNote?: string) =>
  apiClient.post<{ claim: ClanShareClaim }>(`/clan-shares/${id}/inspector-award`, { percent, decisionNote });
