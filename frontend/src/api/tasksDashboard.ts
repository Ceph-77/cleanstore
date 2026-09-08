import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { Task, TaskStatus } from "../types";

export async function listDashboardTasks(
  status?: TaskStatus,
  cursor?: string | null
): Promise<Page<Task>> {
  const r = await apiClient.get<{ tasks: Task[]; nextCursor: string | null }>(
    `/tasks/dashboard${pageQuery(cursor, { status })}`
  );
  return { items: r.tasks, nextCursor: r.nextCursor };
}
