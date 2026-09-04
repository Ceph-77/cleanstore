import { apiClient } from "./client";
import type { TaskInspection } from "../types";

export function getTaskInspection(taskId: string) {
  return apiClient.get<{ inspection: TaskInspection | null }>(`/tasks/${taskId}/inspections`);
}

export function updateTaskInspection(taskId: string, data: { score?: number; notes?: string | null }) {
  return apiClient.patch<{ inspection: TaskInspection }>(`/tasks/${taskId}/inspections`, data);
}

export function createTaskInspection(
  taskId: string,
  data: { score: number; notes: string },
  photosBefore: File[],
  photosAfter: File[]
) {
  const formData = new FormData();
  formData.append("score", String(data.score));
  formData.append("notes", data.notes);
  photosBefore.forEach((file) => formData.append("photosBefore", file));
  photosAfter.forEach((file) => formData.append("photosAfter", file));
  return apiClient.upload<{ inspection: TaskInspection }>(`/tasks/${taskId}/inspections`, formData);
}
