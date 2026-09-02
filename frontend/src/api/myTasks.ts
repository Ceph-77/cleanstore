import { apiClient } from "./client";
import type { Task, TaskInspection, TaskStatus, TaskStep } from "../types";

export function listMyTasks() {
  return apiClient.get<{ tasks: Task[] }>("/marketplace/my-tasks");
}

export interface WorkerPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function updateMyTaskStatus(
  taskId: string,
  status: Extract<TaskStatus, "in_progress" | "completed">,
  note?: string,
  position?: WorkerPosition
) {
  return apiClient.patch<{ task: Task }>(`/marketplace/my-tasks/${taskId}/status`, {
    status,
    note,
    lat: position?.lat,
    lng: position?.lng,
    accuracy: position?.accuracy,
  });
}

export function getMyTaskInspection(taskId: string) {
  return apiClient.get<{ inspection: TaskInspection | null }>(`/marketplace/my-tasks/${taskId}/inspection`);
}

export function toggleMyTaskStep(taskId: string, stepId: string, isDone: boolean) {
  return apiClient.patch<{ step: TaskStep }>(`/marketplace/my-tasks/${taskId}/steps/${stepId}`, { isDone });
}
