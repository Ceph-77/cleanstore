import { apiClient } from "./client";
import type { Task, TaskStatus } from "../types";

export function listMyTasks() {
  return apiClient.get<{ tasks: Task[] }>("/marketplace/my-tasks");
}

export function updateMyTaskStatus(taskId: string, status: Extract<TaskStatus, "in_progress" | "completed">) {
  return apiClient.patch<{ task: Task }>(`/marketplace/my-tasks/${taskId}/status`, { status });
}
