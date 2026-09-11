import { apiClient } from "./client";
import type { Feedback, FeedbackStatus, IncidentSeverity, IncidentType } from "../types";

export interface CreateFeedbackInput {
  selector: string;
  context: string;
  section: string;
  note: string;
  isMulti: boolean;
}

export interface FeedbackUpdateInput {
  status?: FeedbackStatus;
  isImportant?: boolean;
  assignedToId?: string | null;
  assignedCategory?: string | null;
}

export function listFeedback() {
  return apiClient.get<{ entries: Feedback[] }>("/feedback");
}

export function createFeedback(data: CreateFeedbackInput) {
  return apiClient.post<{ entry: Feedback }>("/feedback", data);
}

export function updateFeedback(id: string, data: FeedbackUpdateInput) {
  return apiClient.patch<{ entry: Feedback }>(`/feedback/${id}`, data);
}

export function convertFeedbackToIncident(id: string, type: IncidentType, severity: IncidentSeverity) {
  return apiClient.post<{ entry: Feedback }>(`/feedback/${id}/convert-to-incident`, { type, severity });
}

export function deleteFeedback(id: string) {
  return apiClient.delete<void>(`/feedback/${id}`);
}
