import { apiClient } from "./client";
import type { Feedback } from "../types";

export interface CreateFeedbackInput {
  selector: string;
  context: string;
  section: string;
  note: string;
  isMulti: boolean;
}

export function listFeedback() {
  return apiClient.get<{ entries: Feedback[] }>("/feedback");
}

export function createFeedback(data: CreateFeedbackInput) {
  return apiClient.post<{ entry: Feedback }>("/feedback", data);
}

export function deleteFeedback(id: string) {
  return apiClient.delete<void>(`/feedback/${id}`);
}
