import { apiClient } from "./client";

export function getUnseenCount() {
  return apiClient.get<{ count: number }>("/notifications/unseen-count");
}

export function markSeen() {
  return apiClient.post<void>("/notifications/mark-seen");
}
