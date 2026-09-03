import { apiClient } from "./client";
import type { EngagementSummary, LeaderboardRow, WorkerMoment } from "../types";

export function getMySummary() {
  return apiClient.get<{ summary: EngagementSummary }>("/engagement/me");
}

export function getUnseenMoments() {
  return apiClient.get<{ moments: WorkerMoment[] }>("/engagement/moments/unseen");
}

export function markMomentSeen(id: string) {
  return apiClient.post<void>(`/engagement/moments/${id}/seen`);
}

export function markAllMomentsSeen() {
  return apiClient.post<void>("/engagement/moments/seen");
}

export function getLeaderboard() {
  return apiClient.get<{ rows: LeaderboardRow[] }>("/engagement/leaderboard");
}
