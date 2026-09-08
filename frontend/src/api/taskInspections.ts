import { apiClient } from "./client";
import type { TaskInspection } from "../types";

export interface InspectionData {
  score: number;
  notes: string;
  /** Inspector's correction of the worker-reported metric value. */
  correctedMetricValue?: number | null;
}

export function getTaskInspection(taskId: string) {
  return apiClient.get<{ inspection: TaskInspection | null }>(`/tasks/${taskId}/inspections`);
}

export function updateTaskInspection(
  taskId: string,
  data: { score?: number; notes?: string | null; correctedMetricValue?: number | null }
) {
  return apiClient.patch<{ inspection: TaskInspection }>(`/tasks/${taskId}/inspections`, data);
}

export function createTaskInspection(
  taskId: string,
  data: InspectionData,
  photosBefore: File[],
  photosAfter: File[]
) {
  const formData = new FormData();
  formData.append("score", String(data.score));
  formData.append("notes", data.notes);
  if (data.correctedMetricValue != null) {
    formData.append("correctedMetricValue", String(data.correctedMetricValue));
  }
  photosBefore.forEach((file) => formData.append("photosBefore", file));
  photosAfter.forEach((file) => formData.append("photosAfter", file));
  return apiClient.upload<{ inspection: TaskInspection }>(`/tasks/${taskId}/inspections`, formData);
}
