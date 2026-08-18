import { apiClient } from "./client";
import type { Task, TaskInspection, TaskStatus } from "../types";

export function listMyTasks() {
  return apiClient.get<{ tasks: Task[] }>("/marketplace/my-tasks");
}

export function updateMyTaskStatus(
  taskId: string,
  status: Extract<TaskStatus, "in_progress" | "completed">,
  note?: string
) {
  return apiClient.patch<{ task: Task }>(`/marketplace/my-tasks/${taskId}/status`, { status, note });
}

export function getMyTaskInspection(taskId: string) {
  return apiClient.get<{ inspection: TaskInspection | null }>(`/marketplace/my-tasks/${taskId}/inspection`);
}
