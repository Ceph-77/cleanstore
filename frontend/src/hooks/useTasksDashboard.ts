import { useQuery } from "@tanstack/react-query";
import * as tasksDashboardApi from "../api/tasksDashboard";
import { POLL_MS } from "../queryClient";
import type { TaskStatus } from "../types";

export function useTasksDashboard(status?: TaskStatus) {
  return useQuery({
    queryKey: ["admin", "tasks-dashboard", status ?? "all"],
    queryFn: () => tasksDashboardApi.listDashboardTasks(status).then((r) => r.tasks),
    refetchInterval: POLL_MS,
  });
}
