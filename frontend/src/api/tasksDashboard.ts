import { apiClient } from "./client";
import type { Task, TaskStatus } from "../types";

export function listDashboardTasks(status?: TaskStatus) {
  const query = status ? `?status=${status}` : "";
  return apiClient.get<{ tasks: Task[] }>(`/tasks/dashboard${query}`);
}
