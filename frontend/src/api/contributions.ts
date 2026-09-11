import { apiClient } from "./client";
import type { Contribution, ContributionStatus } from "../types";

export interface CreateContributionInput {
  title: string;
  description: string;
  category?: string;
}

export const createContribution = (data: CreateContributionInput) =>
  apiClient.post<{ contribution: Contribution }>("/contributions", data);

export const listRegistry = () => apiClient.get<{ contributions: Contribution[] }>("/contributions/registry");

export const listContributionsAdmin = (status?: ContributionStatus | null) =>
  apiClient.get<{ contributions: Contribution[] }>(`/contributions${status ? `?status=${status}` : ""}`);

export interface DecideContributionInput {
  status: ContributionStatus;
  decisionNote?: string;
  pointsAwarded?: number;
}

export const decideContribution = (id: string, data: DecideContributionInput) =>
  apiClient.patch<{ contribution: Contribution }>(`/contributions/${id}`, data);
