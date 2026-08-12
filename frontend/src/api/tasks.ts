import { apiClient } from "./client";
import type { Task } from "../types";

export function listTasksForStore(storeId: string) {
  return apiClient.get<{ tasks: Task[] }>(`/stores/${storeId}/tasks`);
}

export function createTask(storeId: string, data: Partial<Task>) {
  return apiClient.post<{ task: Task }>(`/stores/${storeId}/tasks`, data);
}

export function updateTask(id: string, data: Partial<Task>) {
  return apiClient.patch<{ task: Task }>(`/tasks/${id}`, data);
}

export function deleteTask(id: string) {
  return apiClient.delete<void>(`/tasks/${id}`);
}
