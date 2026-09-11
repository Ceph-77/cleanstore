import { apiClient } from "./client";
import type { RewardSummary } from "../types";

export const getMyRewards = () => apiClient.get<RewardSummary>("/rewards/me");

export const getWorkerRewards = (workerId: string) => apiClient.get<RewardSummary>(`/rewards/workers/${workerId}`);
